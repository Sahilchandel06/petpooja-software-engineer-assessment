import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  getTasks: vi.fn(),
  moveTask: vi.fn(),
  patchSubtask: vi.fn(),
  patchTask: vi.fn(),
  postSubtask: vi.fn(),
  postTask: vi.fn(),
  removeSubtask: vi.fn(),
  removeTask: vi.fn(),
}));

vi.mock('../api/tasks.js', () => api);
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }));

import { useBoardStore } from './boardStore.js';

function task(_id) {
  return { _id, title: _id, description: '', priority: 'Medium', columnId: 'todo', orderIndex: 1000, version: 0, tags: [], subtasks: [] };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function setTasks(tasks) {
  const tasksById = Object.fromEntries(tasks.map((item) => [item._id, item]));
  useBoardStore.setState({
    tasksById,
    confirmedTasksById: tasksById,
    columnIds: {
      todo: tasks.map(({ _id }) => _id),
      'in-progress': [],
      done: [],
    },
    loading: false,
    error: null,
    pendingChecklistByTask: {},
  });
}

describe('board store move behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTasks([task('task-a')]);
  });

  it('moves optimistically before the API response and reconciles the saved task', async () => {
    const response = deferred();
    api.moveTask.mockReturnValue(response.promise);

    const pendingMove = useBoardStore.getState().moveTask('task-a', 'in-progress', 1000);
    expect(useBoardStore.getState().tasksById['task-a'].columnId).toBe('in-progress');
    expect(useBoardStore.getState().columnIds.todo).toEqual([]);
    expect(useBoardStore.getState().columnIds['in-progress']).toEqual(['task-a']);
    expect(api.moveTask).toHaveBeenCalledTimes(1);

    response.resolve({ ...task('task-a'), columnId: 'in-progress', orderIndex: 1000, version: 1 });
    await pendingMove;
    expect(useBoardStore.getState().confirmedTasksById['task-a'].version).toBe(1);
  });

  it('rolls back the card and ordered columns when the move API fails', async () => {
    const failure = { response: { data: { error: { message: 'Simulated failure' } } } };
    api.moveTask.mockRejectedValue(failure);

    await expect(useBoardStore.getState().moveTask('task-a', 'done', 1000)).rejects.toBe(failure);
    expect(useBoardStore.getState().tasksById['task-a'].columnId).toBe('todo');
    expect(useBoardStore.getState().columnIds.todo).toEqual(['task-a']);
    expect(useBoardStore.getState().columnIds.done).toEqual([]);
    expect(api.moveTask).toHaveBeenCalledTimes(1);
  });

  it('sends queued moves in FIFO order while each card updates immediately', async () => {
    setTasks([task('task-a'), task('task-b'), task('task-c')]);
    const pending = [];
    api.moveTask.mockImplementation((taskId, move) => {
      const response = deferred();
      pending.push({ taskId, move, ...response });
      return response.promise;
    });

    const first = useBoardStore.getState().moveTask('task-a', 'in-progress', 1000);
    const second = useBoardStore.getState().moveTask('task-b', 'in-progress', 2000);
    const third = useBoardStore.getState().moveTask('task-c', 'in-progress', 3000);
    expect(useBoardStore.getState().columnIds['in-progress']).toEqual(['task-a', 'task-b', 'task-c']);
    expect(pending.map(({ taskId }) => taskId)).toEqual(['task-a']);

    pending[0].resolve({ ...task('task-a'), columnId: 'in-progress', orderIndex: 1000, version: 1 });
    await vi.waitFor(() => expect(pending.map(({ taskId }) => taskId)).toEqual(['task-a', 'task-b']));
    pending[1].resolve({ ...task('task-b'), columnId: 'in-progress', orderIndex: 2000, version: 1 });
    await vi.waitFor(() => expect(pending.map(({ taskId }) => taskId)).toEqual(['task-a', 'task-b', 'task-c']));
    pending[2].resolve({ ...task('task-c'), columnId: 'in-progress', orderIndex: 3000, version: 1 });

    await Promise.all([first, second, third]);
    expect(pending.map(({ taskId }) => taskId)).toEqual(['task-a', 'task-b', 'task-c']);
  });
});
