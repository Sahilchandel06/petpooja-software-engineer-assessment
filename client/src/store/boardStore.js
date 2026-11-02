import { create } from 'zustand';
import { getTasks, patchTask, postTask, removeTask } from '../api/tasks.js';

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

  // Step 3 controls intentionally move only local state; persistence arrives with the move API later.
  moveTaskLocally(taskId, direction) {
    const task = get().tasksById[taskId];
    if (!task) return;

    const columnIndex = COLUMNS.findIndex(({ id }) => id === task.columnId);
    const currentIds = get().columnIds[task.columnId];
    const taskIndex = currentIds.indexOf(taskId);

    if (direction === 'up' || direction === 'down') {
      const targetIndex = taskIndex + (direction === 'up' ? -1 : 1);
      if (targetIndex < 0 || targetIndex >= currentIds.length) return;

      const nextIds = [...currentIds];
      [nextIds[taskIndex], nextIds[targetIndex]] = [nextIds[targetIndex], nextIds[taskIndex]];
      set((state) => ({
        columnIds: { ...state.columnIds, [task.columnId]: nextIds },
      }));
      return;
    }

    const targetColumnIndex = columnIndex + (direction === 'left' ? -1 : 1);
    if ((direction !== 'left' && direction !== 'right')
      || targetColumnIndex < 0 || targetColumnIndex >= COLUMNS.length) return;

    const targetColumnId = COLUMNS[targetColumnIndex].id;
    const targetIds = get().columnIds[targetColumnId];
    const nextOrderIndex = targetIds.length
      ? get().tasksById[targetIds[targetIds.length - 1]].orderIndex + 1000
      : 1000;

    set((state) => ({
      tasksById: {
        ...state.tasksById,
        [taskId]: { ...task, columnId: targetColumnId, orderIndex: nextOrderIndex },
      },
      columnIds: {
        ...state.columnIds,
        [task.columnId]: removeId(state.columnIds[task.columnId], taskId),
        [targetColumnId]: [...state.columnIds[targetColumnId], taskId],
      },
    }));
  },
}));
