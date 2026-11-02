import { create } from 'zustand';
import toast from 'react-hot-toast';
import { getEndIndex } from '../utils/fractionalIndex.js';
import { getTasks, moveTask as sendMoveTask, patchTask, postTask, removeTask } from '../api/tasks.js';
import { moveOperationQueue } from './operationQueue.js';

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
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function rebuildColumnIds(tasksById) {
  const columnIds = emptyColumnIds();
  Object.values(tasksById).forEach((task) => {
    if (columnIds[task.columnId]) columnIds[task.columnId].push(task._id);
  });
  Object.values(columnIds).forEach((ids) => ids.sort((a, b) => tasksById[a].orderIndex - tasksById[b].orderIndex));
  return columnIds;
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
  confirmedTasksById: {},
  columnIds: emptyColumnIds(),
  loading: true,
  error: null,

  async fetchTasks() {
    set({ loading: true, error: null });
    try {
      const tasks = await getTasks();
      const normalized = normalizeTasks(tasks);
      set({ ...normalized, confirmedTasksById: normalized.tasksById, loading: false, error: null });
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
        const confirmedTasksById = { ...state.confirmedTasksById };
        delete tasksById[temporaryId];
        tasksById[task._id] = task;
        confirmedTasksById[task._id] = task;
        return {
          tasksById,
          confirmedTasksById,
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
      set((state) => ({ tasksById: { ...state.tasksById, [task._id]: task }, confirmedTasksById: { ...state.confirmedTasksById, [task._id]: task } }));
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
      set((state) => {
        const confirmedTasksById = { ...state.confirmedTasksById };
        delete confirmedTasksById[taskId];
        return { confirmedTasksById };
      });
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
    const targetIds = removeId(beforeMove.columnIds[toColumnId], taskId);
    let insertionIndex = targetIds.findIndex((id) => (
      beforeMove.tasksById[id].orderIndex > targetIndex
    ));
    if (insertionIndex === -1) insertionIndex = targetIds.length;
    const beforeId = targetIds[insertionIndex - 1] || null;
    const afterId = targetIds[insertionIndex] || null;
    targetIds.splice(insertionIndex, 0, taskId);
    const operation = { taskId, operationId: operationId(), toColumnId, beforeId, afterId };

    // Keep the board responsive; only the network request waits its turn in the FIFO.
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

    return moveOperationQueue.enqueue({
      taskId,
      operationId: operation.operationId,
      run: async () => {
        const latest = get();
        const confirmed = latest.confirmedTasksById[taskId];
        if (!confirmed) throw new Error('Task is no longer available.');
        // Neighbor anchors rebase this move after earlier queued moves changed the board.
        const currentTargets = latest.columnIds[toColumnId].filter((id) => id !== taskId);
        let index = operation.beforeId ? currentTargets.indexOf(operation.beforeId) + 1 : 0;
        if (operation.beforeId && index === 0) index = operation.afterId ? currentTargets.indexOf(operation.afterId) : -1;
        if (index < 0) index = currentTargets.length;
        if (operation.afterId && currentTargets.includes(operation.afterId) && (!operation.beforeId || !currentTargets.includes(operation.beforeId))) {
          index = currentTargets.indexOf(operation.afterId);
        }
        const previousIndex = index > 0 ? get().tasksById[currentTargets[index - 1]]?.orderIndex ?? null : null;
        const nextIndex = index < currentTargets.length ? get().tasksById[currentTargets[index]]?.orderIndex ?? null : null;
        let orderIndex;
        if (previousIndex === null) orderIndex = nextIndex === null ? 1000 : nextIndex - 1000;
        else if (nextIndex === null) orderIndex = previousIndex + 1000;
        else orderIndex = previousIndex + (nextIndex - previousIndex) / 2;

        const payload = { columnId: toColumnId, orderIndex, version: confirmed.version || 0, operationId: operation.operationId };
        let savedTask;
        try {
          savedTask = await sendMoveTask(taskId, payload);
        } catch (error) {
          if (!error.response) {
            // A lost response may mean the server committed; replay same payload/key once.
            try { savedTask = await sendMoveTask(taskId, payload); } catch (retryError) { error = retryError; }
          }
          if (!savedTask) {
            const currentTask = error.response?.data?.error?.currentTask;
            set((state) => {
              const tasksById = { ...state.tasksById, [taskId]: currentTask || state.confirmedTasksById[taskId] };
              return { tasksById, confirmedTasksById: currentTask ? { ...state.confirmedTasksById, [taskId]: currentTask } : state.confirmedTasksById, columnIds: rebuildColumnIds(tasksById) };
            });
            moveOperationQueue.dropPendingForTask(taskId, Object.assign(new Error('Queued move was dropped because an earlier move failed.'), { dropped: true }));
            reportMutationFailure(error);
            throw error;
          }
        }

        const { rebalancedTasks = [], ...savedRecord } = savedTask;
        set((state) => {
          const tasksById = { ...state.tasksById };
          const confirmedTasksById = { ...state.confirmedTasksById, [taskId]: savedRecord };
          rebalancedTasks.forEach((rebalancedTask) => {
            const neighborId = String(rebalancedTask._id);
            confirmedTasksById[neighborId] = rebalancedTask;
            tasksById[neighborId] = moveOperationQueue.hasPendingForTask(neighborId)
              ? { ...tasksById[neighborId], version: rebalancedTask.version, orderIndex: rebalancedTask.orderIndex }
              : rebalancedTask;
          });
          // Preserve a later optimistic position while accepting the new server version.
          const hasLaterMove = moveOperationQueue.hasPendingForTask(taskId);
          tasksById[taskId] = hasLaterMove
            ? { ...tasksById[taskId], version: savedRecord.version, updatedAt: savedRecord.updatedAt }
            : savedRecord;
          return { tasksById, confirmedTasksById, columnIds: rebuildColumnIds(tasksById) };
        });
        return savedRecord;
      },
    }).catch((error) => {
      if (error.dropped) return;
      throw error;
    });
  },
}));
