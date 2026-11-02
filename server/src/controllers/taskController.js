import Task from '../models/Task.js';
import { getEndIndex } from '../utils/fractionalIndex.js';

const columnOrder = { todo: 0, 'in-progress': 1, done: 2 };

export async function listTasks(_request, response) {
  const tasks = await Task.find().sort({ columnId: 1, orderIndex: 1 }).lean();
  // Keep the assessment's visual column sequence even though enum strings sort alphabetically.
  tasks.sort((left, right) => columnOrder[left.columnId] - columnOrder[right.columnId]
    || left.orderIndex - right.orderIndex);
  return response.status(200).json(tasks);
}

export async function createTask(request, response) {
  const input = request.validated.body;
  const lastTask = await Task.findOne({ columnId: input.columnId }).sort({ orderIndex: -1 }).select('orderIndex').lean();
  const task = await Task.create({ ...input, orderIndex: getEndIndex(lastTask?.orderIndex ?? null) });
  return response.status(201).json(task);
}

export async function updateTask(request, response) {
  const task = await Task.findByIdAndUpdate(
    request.params.id,
    { $set: request.validated.body, $inc: { version: 1 } },
    { new: true, runValidators: true },
  );
  if (!task) {
    const error = new Error('Task not found');
    error.status = 404;
    error.code = 'TASK_NOT_FOUND';
    throw error;
  }
  return response.status(200).json(task);
}

export async function deleteTask(request, response) {
  const task = await Task.findByIdAndDelete(request.params.id);
  if (!task) {
    const error = new Error('Task not found');
    error.status = 404;
    error.code = 'TASK_NOT_FOUND';
    throw error;
  }
  return response.status(204).end();
}
