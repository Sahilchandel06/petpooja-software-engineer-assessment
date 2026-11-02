import { create } from 'zustand';
import toast from 'react-hot-toast';
import { getEndIndex } from '../utils/fractionalIndex.js';
import { getTasks, moveTask as sendMoveTask, patchTask, postTask, removeTask } from '../api/tasks.js';

export const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

const emptyColumnIds = () => Object.fromEntries(COLUMNS.map(({ id }) => [id, []]));

function normalizeTasks(tasks) {
  const tasksById = {};
  const columnIds = emptyColumnIds();

  tasks.forEach((task) => {
    const id = task._id;
    tasksById[id] = task;
    if (columnIds[task.columnId]) columnIds[task.columnId].push(id);
  });

  COLUMNS.forEach(({ id }) => {
    columnIds[id].sort((leftId, rightId) => (
      tasksById[leftId].orderIndex - tasksById[rightId].orderIndex
    ));
  });

  return { tasksById, columnIds };
}

function removeId(list, id) {
  return list.filter((currentId) => currentId !== id);
}

function operationId() {
  return globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getFailureMessage(error) {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'The request timed out. Your previous board state was restored.';
  }
  if (!error.response) {
    return 'The API could not be reached. Check that the server is running; your previous board state was restored.';
  }
  return error.response.data?.error?.message || 'The request failed. Your previous board state was restored.';
}

function insertByOrder(ids, taskId, task, tasksById) {
  const nextIds = removeId(ids, taskId);
  const position = nextIds.findIndex((id) => tasksById[id].orderIndex > task.orderIndex);
  nextIds.splice(position < 0 ? nextIds.length : position, 0, taskId);
  return nextIds;
}

function reportMutationFailure(error) {
  toast.error(getFailureMessage(error));
}

export const useBoardStore = create((set, get) => ({
  tasksById: {},
  columnIds: emptyColumnIds(),
  loading: true,
  error: null,

  async fetchTasks() {
    set({ loading: true, error: null });
    try {
      const tasks = await getTasks();
      set({ ...normalizeTasks(tasks), loading: false, error: null });
    } catch (error) {
      set({ loading: false, error: error.message || 'Could not load tasks.' });
      throw error;
    }
  },

  async createTask(input) {
    const stateBeforeCreate = get();
    const columnId = input.columnId;
    const previousColumnIds = [...stateBeforeCreate.columnIds[columnId]];
    const lastTaskId = previousColumnIds[previousColumnIds.length - 1];
    const temporaryId = `temp-${operationId()}`;
    const temporaryTask = {
      ...input,
      _id: temporaryId,
      orderIndex: getEndIndex(lastTaskId ? stateBeforeCreate.tasksById[lastTaskId].orderIndex : null),
      priority: input.priority || 'Medium',
      tags: input.tags || [],
      subtasks: input.subtasks || [],
      version: 0,
      _pending: true,
    };

    // A temporary ID lets the new card render immediately before the server assigns MongoDB's ID.
    set((state) => ({
      tasksById: { ...state.tasksById, [temporaryId]: temporaryTask },
      columnIds: { ...state.columnIds, [columnId]: [...state.columnIds[columnId], temporaryId] },
    }));

    try {
      const task = await postTask(input);
      set((state) => {
        const tasksById = { ...state.tasksById };
        delete tasksById[temporaryId];
        tasksById[task._id] = task;
        return {
          tasksById,
          columnIds: {
            ...state.columnIds,
            [columnId]: insertByOrder(state.columnIds[columnId], task._id, task, tasksById),
          },
        };
      });
      return task;
    } catch (error) {
      set((state) => {
        const tasksById = { ...state.tasksById };
        delete tasksById[temporaryId];
        const currentIds = state.columnIds[columnId];
        return {
          tasksById,
          columnIds: {
            ...state.columnIds,
            // Remove only this temporary card, preserving any unrelated work that arrived meanwhile.
            [columnId]: currentIds.includes(temporaryId)
              ? removeId(currentIds, temporaryId)
              : previousColumnIds,
          },
        };
      });
      reportMutationFailure(error);
      throw error;
    }
  },

  async updateTask(taskId, changes) {
    const previousTask = get().tasksById[taskId];
    if (!previousTask || previousTask._pending) return;

    set((state) => ({
      tasksById: { ...state.tasksById, [taskId]: { ...previousTask, ...changes } },
    }));
    try {
      const task = await patchTask(taskId, changes);
      set((state) => ({ tasksById: { ...state.tasksById, [task._id]: task } }));
      return task;
    } catch (error) {
      set((state) => ({ tasksById: { ...state.tasksById, [taskId]: previousTask } }));
      reportMutationFailure(error);
      throw error;
    }
  },

  async deleteTask(taskId) {
    const previousState = get();
    const task = previousState.tasksById[taskId];
    if (!task || task._pending) return;
    const previousColumnIds = [...previousState.columnIds[task.columnId]];
    const previousIndex = previousColumnIds.indexOf(taskId);

    set((state) => {
      const tasksById = { ...state.tasksById };
      delete tasksById[taskId];
      return {
        tasksById,
        columnIds: { ...state.columnIds, [task.columnId]: removeId(state.columnIds[task.columnId], taskId) },
      };
    });

    try {
      await removeTask(taskId);
    } catch (error) {
      set((state) => {
        const currentIds = state.columnIds[task.columnId];
        if (currentIds.includes(taskId)) return state;
        const restoredIds = [...currentIds];
        restoredIds.splice(Math.min(previousIndex, restoredIds.length), 0, taskId);
        return {
          tasksById: { ...state.tasksById, [taskId]: task },
          columnIds: { ...state.columnIds, [task.columnId]: restoredIds },
        };
      });
      reportMutationFailure(error);
      throw error;
    }
  },

  async moveTask(taskId, toColumnId, targetIndex) {
    const beforeMove = get();
    const task = beforeMove.tasksById[taskId];
    if (!task || task._pending || !beforeMove.columnIds[toColumnId]) return;

    const snapshot = {
      task,
      sourceColumnIds: [...beforeMove.columnIds[task.columnId]],
      targetColumnIds: task.columnId === toColumnId ? null : [...beforeMove.columnIds[toColumnId]],
    };

    const targetIds = removeId(beforeMove.columnIds[toColumnId], taskId);
    let insertionIndex = targetIds.findIndex((id) => (
      beforeMove.tasksById[id].orderIndex > targetIndex
    ));
    if (insertionIndex === -1) insertionIndex = targetIds.length;
    targetIds.splice(insertionIndex, 0, taskId);

    // Snapshot holds this task and both affected column orders so a failed move can be undone.
    set((state) => ({
      tasksById: {
        ...state.tasksById,
        [taskId]: { ...task, columnId: toColumnId, orderIndex: targetIndex },
      },
      columnIds: {
        ...state.columnIds,
        [task.columnId]: removeId(state.columnIds[task.columnId], taskId),
        [toColumnId]: targetIds,
      },
    }));

    try {
      const savedTask = await sendMoveTask(taskId, {
        columnId: toColumnId,
        orderIndex: targetIndex,
        version: task.version || 0,
        operationId: operationId(),
      });

      set((state) => {
        const tasksById = { ...state.tasksById, [taskId]: savedTask };
        const columnIds = { ...state.columnIds };
        COLUMNS.forEach(({ id }) => { columnIds[id] = removeId(columnIds[id], taskId); });
        columnIds[savedTask.columnId] = insertByOrder(columnIds[savedTask.columnId], taskId, savedTask, tasksById);
        return { tasksById, columnIds };
      });
      return savedTask;
    } catch (error) {
      set((state) => ({
        tasksById: { ...state.tasksById, [taskId]: snapshot.task },
        columnIds: {
          ...state.columnIds,
          [task.columnId]: snapshot.sourceColumnIds,
          ...(snapshot.targetColumnIds ? { [toColumnId]: snapshot.targetColumnIds } : {}),
        },
      }));
      reportMutationFailure(error);
      throw error;
    }
  },
}));
