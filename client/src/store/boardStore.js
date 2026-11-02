import { create } from 'zustand';
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
    const task = await postTask(input);
    set((state) => ({
      tasksById: { ...state.tasksById, [task._id]: task },
      columnIds: {
        ...state.columnIds,
        [task.columnId]: [...state.columnIds[task.columnId], task._id],
      },
    }));
    return task;
  },

  async updateTask(taskId, changes) {
    const task = await patchTask(taskId, changes);
    set((state) => ({ tasksById: { ...state.tasksById, [task._id]: task } }));
    return task;
  },

  async deleteTask(taskId) {
    await removeTask(taskId);
    set((state) => {
      const task = state.tasksById[taskId];
      if (!task) return state;
      const tasksById = { ...state.tasksById };
      delete tasksById[taskId];
      return {
        tasksById,
        columnIds: {
          ...state.columnIds,
          [task.columnId]: removeId(state.columnIds[task.columnId], taskId),
        },
      };
    });
  },

  async moveTask(taskId, toColumnId, targetIndex) {
    const beforeMove = get();
    const task = beforeMove.tasksById[taskId];
    if (!task || !beforeMove.columnIds[toColumnId]) return;

    const targetIds = removeId(beforeMove.columnIds[toColumnId], taskId);
    let insertionIndex = targetIds.findIndex((id) => (
      beforeMove.tasksById[id].orderIndex > targetIndex
    ));
    if (insertionIndex === -1) insertionIndex = targetIds.length;
    targetIds.splice(insertionIndex, 0, taskId);

    // Move the card immediately; Step 5 adds snapshot rollback for failed requests.
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

    const operationId = globalThis.crypto?.randomUUID?.()
      || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const savedTask = await sendMoveTask(taskId, {
      columnId: toColumnId,
      orderIndex: targetIndex,
      version: task.version || 0,
      operationId,
    });

    set((state) => ({
      tasksById: { ...state.tasksById, [taskId]: savedTask },
    }));
    return savedTask;
  },
}));
