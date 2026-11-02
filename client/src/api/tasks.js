import { http } from './http.js';

export async function getTasks() {
  const { data } = await http.get('/tasks');
  return data;
}

export async function postTask(task) {
  const { data } = await http.post('/tasks', task);
  return data;
}

export async function patchTask(taskId, changes) {
  const { data } = await http.patch(`/tasks/${taskId}`, changes);
  return data;
}

export async function removeTask(taskId) {
  await http.delete(`/tasks/${taskId}`);
}

export async function moveTask(taskId, move) {
  const { data } = await http.patch(`/tasks/${taskId}/move`, move);
  return data;
}

export async function postSubtask(taskId, subtask) {
  const { data } = await http.post(`/tasks/${taskId}/subtasks`, subtask);
  return data;
}

export async function patchSubtask(taskId, subtaskId, changes) {
  const { data } = await http.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, changes);
  return data;
}

export async function removeSubtask(taskId, subtaskId) {
  const { data } = await http.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
  return data;
}
