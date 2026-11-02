import { after, afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import app from '../src/app.js';
import MoveOperation from '../src/models/MoveOperation.js';
import Task from '../src/models/Task.js';

let mongo;

// Keep the downloaded test database binary inside the project workspace/cache.
process.env.MONGOMS_DOWNLOAD_DIR ||= resolve('test/.mongodb-binaries');

// Top-level await ensures no API test starts before the replica set and indexes are ready.
mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
await mongoose.connect(mongo.getUri());
await Promise.all([Task.init(), MoveOperation.init()]);

afterEach(async () => {
  await Promise.all([Task.deleteMany({}), MoveOperation.deleteMany({})]);
});

after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

async function createTask(overrides = {}) {
  const response = await request(app).post('/api/tasks').send({ title: 'Test task', columnId: 'todo', ...overrides });
  assert.equal(response.status, 201);
  return response.body;
}

describe('task API', () => {
  it('supports task create, list, update, delete, and validation status codes', async () => {
    const created = await createTask();
    assert.equal((await request(app).get('/api/tasks')).status, 200);
    const updated = await request(app).patch(`/api/tasks/${created._id}`).send({ title: 'Renamed task' });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.title, 'Renamed task');
    assert.equal((await request(app).delete(`/api/tasks/${created._id}`)).status, 204);
    assert.equal((await request(app).delete(`/api/tasks/${created._id}`)).status, 404);
    assert.equal((await request(app).post('/api/tasks').send({ title: '', columnId: 'todo' })).status, 400);
    assert.equal((await request(app).get('/api/not-a-route')).status, 404);
  });

  it('returns 409 and the current task for a stale move version', async () => {
    const task = await createTask();
    const initialMove = {
      columnId: 'in-progress', orderIndex: 1000, version: task.version, operationId: randomUUID(),
    };
    assert.equal((await request(app).patch(`/api/tasks/${task._id}/move`).send(initialMove)).status, 200);
    const staleMove = { ...initialMove, columnId: 'done', version: task.version, operationId: randomUUID() };
    const response = await request(app).patch(`/api/tasks/${task._id}/move`).send(staleMove);
    assert.equal(response.status, 409);
    assert.equal(response.body.error.currentTask.version, task.version + 1);
  });

  it('returns the same stored result for an idempotent move retry', async () => {
    const task = await createTask();
    const move = { columnId: 'done', orderIndex: 1000, version: task.version, operationId: randomUUID() };
    const first = await request(app).patch(`/api/tasks/${task._id}/move`).send(move);
    const retry = await request(app).patch(`/api/tasks/${task._id}/move`).send(move);
    assert.equal(first.status, 200);
    assert.equal(retry.status, 200);
    assert.equal(retry.body.version, first.body.version);
  });

  it('persists concurrent moves without losing or duplicating cards', async () => {
    const tasks = await Promise.all(Array.from({ length: 5 }, (_, index) => createTask({ title: `Concurrent ${index}` })));
    const responses = await Promise.all(tasks.map((task, index) => (
      request(app).patch(`/api/tasks/${task._id}/move`).send({
        columnId: 'in-progress', orderIndex: (index + 1) * 1000,
        version: task.version, operationId: randomUUID(),
      })
    )));
    assert.ok(responses.every((response) => response.status === 200));
    const finalTasks = await Task.find({ _id: { $in: tasks.map(({ _id }) => _id) }, columnId: 'in-progress' }).lean();
    assert.equal(finalTasks.length, tasks.length);
    assert.equal(new Set(finalTasks.map(({ _id }) => String(_id))).size, tasks.length);
    assert.equal(new Set(finalTasks.map(({ orderIndex }) => orderIndex)).size, tasks.length);
  });

  it('uses atomic checklist endpoints and increments the shared task version', async () => {
    const task = await createTask();
    const added = await request(app).post(`/api/tasks/${task._id}/subtasks`).send({ title: 'First item' });
    assert.equal(added.status, 201);
    assert.equal(added.body.version, 1);

    const concurrentlyAdded = await Promise.all([
      request(app).post(`/api/tasks/${task._id}/subtasks`).send({ title: 'Second item' }),
      request(app).post(`/api/tasks/${task._id}/subtasks`).send({ title: 'Third item' }),
    ]);
    assert.ok(concurrentlyAdded.every((response) => response.status === 201));
    let current = await Task.findById(task._id).lean();
    assert.equal(current.subtasks.length, 3);

    const subtaskId = String(current.subtasks[0]._id);
    const toggled = await request(app).patch(`/api/tasks/${task._id}/subtasks/${subtaskId}`).send({ completed: true });
    assert.equal(toggled.status, 200);
    assert.equal(toggled.body.subtasks.find((item) => String(item._id) === subtaskId).completed, true);
    const renamed = await request(app).patch(`/api/tasks/${task._id}/subtasks/${subtaskId}`).send({ title: 'Renamed item' });
    assert.equal(renamed.status, 200);
    assert.equal(renamed.body.subtasks.find((item) => String(item._id) === subtaskId).title, 'Renamed item');
    assert.equal((await request(app).patch(`/api/tasks/${task._id}/subtasks/${subtaskId}`).send({ title: '' })).status, 400);
    assert.equal((await request(app).patch(`/api/tasks/${task._id}/subtasks/not-an-id`).send({ completed: false })).status, 400);
    assert.equal((await request(app).delete(`/api/tasks/${task._id}/subtasks/${subtaskId}`)).status, 200);
    assert.equal((await request(app).delete(`/api/tasks/${task._id}/subtasks/${subtaskId}`)).status, 404);

    current = await Task.findById(task._id).lean();
    assert.equal(current.subtasks.length, 2);
    assert.equal(current.version, 6);
  });
});
