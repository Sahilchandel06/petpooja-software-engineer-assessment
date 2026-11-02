import Task from '../models/Task.js';
import MoveOperation from '../models/MoveOperation.js';
import mongoose from 'mongoose';
import { getEndIndex } from '../utils/fractionalIndex.js';

const ORDER_GAP = 1000;
const ORDER_EPSILON = 1e-6;

function apiError(message, status, code, currentTask) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  if (currentTask) error.currentTask = currentTask;
  return error;
}

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

export async function addSubtask(request, response) {
  // Push one item atomically and bump the shared task revision so stale moves receive 409.
  const task = await Task.findByIdAndUpdate(
    request.params.id,
    { $push: { subtasks: { title: request.validated.body.title, completed: false } }, $inc: { version: 1 } },
    { new: true, runValidators: true },
  );
  if (!task) throw apiError('Task not found', 404, 'TASK_NOT_FOUND');
  return response.status(201).json(task);
}

export async function updateSubtask(request, response) {
  // Positional updates touch one subdocument; no handler reads and rewrites the whole checklist.
  const updates = Object.fromEntries(Object.entries(request.validated.body)
    .map(([field, value]) => [`subtasks.$.${field}`, value]));
  const task = await Task.findOneAndUpdate(
    { _id: request.params.id, 'subtasks._id': request.params.subtaskId },
    { $set: updates, $inc: { version: 1 } },
    { new: true, runValidators: true },
  );
  if (!task) throw apiError('Task or subtask not found', 404, 'SUBTASK_NOT_FOUND');
  return response.status(200).json(task);
}

export async function deleteSubtask(request, response) {
  // Pull only the requested subdocument; the version increment informs stale move requests.
  const task = await Task.findOneAndUpdate(
    { _id: request.params.id, 'subtasks._id': request.params.subtaskId },
    { $pull: { subtasks: { _id: request.params.subtaskId } }, $inc: { version: 1 } },
    { new: true, runValidators: true },
  );
  if (!task) throw apiError('Task or subtask not found', 404, 'SUBTASK_NOT_FOUND');
  return response.status(200).json(task);
}

export async function moveTask(request, response) {
  const { columnId, orderIndex, version, operationId } = request.validated.body;
  const taskId = request.params.id;
  const session = await mongoose.startSession();
  let result;
  let rebalancedTasks = [];
  try {
    await session.withTransaction(async () => {
      rebalancedTasks = [];
      const existingOperation = await MoveOperation.findOne({ operationId }).session(session).lean();
      if (existingOperation) {
        const sameRequest = String(existingOperation.taskId) === taskId
          && existingOperation.columnId === columnId
          && existingOperation.orderIndex === orderIndex;
        if (!sameRequest) throw apiError('operationId was already used for a different move.', 409, 'IDEMPOTENCY_KEY_REUSED');
        result = existingOperation.resultTask;
        rebalancedTasks = existingOperation.rebalancedTasks || [];
        return;
      }

      const current = await Task.findById(taskId).session(session).lean();
      if (!current) throw apiError('Task not found', 404, 'TASK_NOT_FOUND');
      if (current.version !== version) throw apiError('Task changed on the server. The latest task was loaded.', 409, 'VERSION_CONFLICT', current);

      const neighbors = await Task.find({ columnId, _id: { $ne: taskId } })
        .sort({ orderIndex: 1, _id: 1 }).session(session).lean();
      let position = neighbors.findIndex((neighbor) => neighbor.orderIndex > orderIndex);
      if (position < 0) position = neighbors.length;
      const previousIndex = position > 0 ? neighbors[position - 1].orderIndex : null;
      const nextIndex = position < neighbors.length ? neighbors[position].orderIndex : null;
      const gapTooSmall = previousIndex !== null && nextIndex !== null
        && nextIndex - previousIndex <= ORDER_EPSILON;

      let destinationIndex = orderIndex;
      if (gapTooSmall) {
        // Reserve a new spaced slot for this move in the same transaction as the reindex.
        const writes = neighbors.map((neighbor, index) => {
          const rank = index < position ? index : index + 1;
          const orderIndex = (rank + 1) * ORDER_GAP;
          rebalancedTasks.push({ ...neighbor, orderIndex, version: neighbor.version + 1 });
          return { updateOne: { filter: { _id: neighbor._id }, update: { $set: { orderIndex }, $inc: { version: 1 } } } };
        });
        if (writes.length) await Task.bulkWrite(writes, { session });
        destinationIndex = (position + 1) * ORDER_GAP;
      }

      const moved = await Task.findOneAndUpdate(
        { _id: taskId, version },
        { $set: { columnId, orderIndex: destinationIndex }, $inc: { version: 1 } },
        { new: true, runValidators: true, session },
      ).lean();
      if (!moved) {
        const latest = await Task.findById(taskId).session(session).lean();
        throw apiError('Task changed on the server. The latest task was loaded.', 409, 'VERSION_CONFLICT', latest);
      }

      result = moved;
      await MoveOperation.create([{
        operationId, taskId, columnId, orderIndex,
        resultTask: moved,
        rebalancedTasks,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }], { session });
    });
  } catch (error) {
    // Concurrent duplicate retries can race to insert the unique operation ID.
    if (error.code === 11000) {
      const prior = await MoveOperation.findOne({ operationId }).lean();
      if (prior && String(prior.taskId) === taskId && prior.columnId === columnId && prior.orderIndex === orderIndex) {
        result = prior.resultTask;
        rebalancedTasks = prior.rebalancedTasks || [];
      } else if (prior) {
        throw apiError('operationId was already used for a different move.', 409, 'IDEMPOTENCY_KEY_REUSED');
      } else throw error;
    } else if (error.code === 20 || /transaction numbers are only allowed|replica set/i.test(error.message)) {
      throw apiError('Moves require MongoDB transactions. Use Atlas or configure local MongoDB as a replica set (mongod --replSet rs0, then rs.initiate()).', 503, 'TRANSACTIONS_REQUIRE_REPLICA_SET');
    } else throw error;
  } finally {
    await session.endSession();
  }
  // The extra list lets clients reconcile rare transactional rebalances without a full reload.
  return response.status(200).json({ ...result, rebalancedTasks });
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
