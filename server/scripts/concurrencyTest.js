import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import Task from '../src/models/Task.js';

const apiBase = (process.env.API_URL || `http://localhost:${process.env.PORT || 5000}/api`).replace(/\/$/, '');
const marker = `concurrency-${randomUUID()}`;

async function requestMove(task, columnId, orderIndex, operationId, version = task.version) {
  return fetch(`${apiBase}/tasks/${task._id}/move`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ columnId, orderIndex, version, operationId }),
  });
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI before running the concurrency check.');
  await mongoose.connect(process.env.MONGO_URI);
  const created = await Task.create(Array.from({ length: 5 }, (_, index) => ({
    title: `${marker}-${index + 1}`,
    columnId: 'todo',
    orderIndex: 900000 + index * 1000,
  })));

  try {
    // Five overlapping HTTP writes should all persist distinct cards and positions.
    const requests = await Promise.all(created.map((task, index) => (
      requestMove(task, 'in-progress', 900000 + index * 1000, randomUUID())
    )));
    assert.ok(requests.every((response) => response.status === 200), 'all five concurrent moves should succeed');

    // Replaying one exact key is safe and must not increment the task version again.
    const replayTask = await Task.findById(created[0]._id).lean();
    const replayId = randomUUID();
    const firstReplay = await requestMove(replayTask, 'done', 3000000, replayId);
    assert.equal(firstReplay.status, 200);
    const firstResult = await firstReplay.json();
    const repeated = await requestMove(replayTask, 'done', 3000000, replayId);
    assert.equal(repeated.status, 200);
    assert.equal((await repeated.json()).version, firstResult.version, 'idempotent replay must not apply twice');

    // Two clients with the same observed version: one wins and one gets the latest task in a 409.
    const staleTask = await Task.findById(created[1]._id).lean();
    const conflicts = await Promise.all([
      requestMove(staleTask, 'done', 4000000, randomUUID()),
      requestMove(staleTask, 'todo', 5000000, randomUUID()),
    ]);
    assert.equal(conflicts.filter((response) => response.status === 200).length, 1);
    assert.equal(conflicts.filter((response) => response.status === 409).length, 1);
    const conflictBody = await conflicts.find((response) => response.status === 409).json();
    assert.ok(conflictBody.error.currentTask, '409 response includes currentTask for client reconciliation');

    const finalTasks = await Task.find({ title: { $regex: `^${marker}` } }).sort({ columnId: 1, orderIndex: 1 }).lean();
    assert.equal(finalTasks.length, created.length, 'no test cards were lost');
    assert.equal(new Set(finalTasks.map((task) => String(task._id))).size, created.length, 'no duplicate cards');
    const movedRows = finalTasks.filter((task) => task.columnId === 'in-progress');
    assert.equal(new Set(movedRows.map((task) => task.orderIndex)).size, movedRows.length, 'moved cards have distinct order indexes');
    assert.ok(movedRows.every((task, index) => index === 0 || movedRows[index - 1].orderIndex < task.orderIndex), 'column order indexes are strictly increasing');
    const listedResponse = await fetch(`${apiBase}/tasks`);
    assert.equal(listedResponse.status, 200);
    const listedTestTasks = (await listedResponse.json()).filter((task) => task.title.startsWith(marker));
    assert.equal(listedTestTasks.length, created.length, 'the API exposes every test card exactly once');
    console.log('Concurrency check passed: five concurrent moves, idempotent retry, version conflict, and unique final cards.');
  } finally {
    await Task.deleteMany({ title: { $regex: `^${marker}` } });
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('Concurrency check failed:', error.message);
  process.exitCode = 1;
});
