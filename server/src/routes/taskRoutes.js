import { Router } from 'express';
import { z } from 'zod';
import {
  createTask,
  addSubtask,
  deleteTask,
  deleteSubtask,
  listTasks,
  moveTask,
  updateTask,
  updateSubtask,
} from '../controllers/taskController.js';
import { simulateFailure } from '../middleware/simulateFailure.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const columnSchema = z.enum(['todo', 'in-progress', 'done']);
const subtaskSchema = z.object({
  title: z.string().trim().min(1),
  completed: z.boolean().optional(),
}).strict();
const taskFields = {
  title: z.string().trim().min(1).max(120),
  description: z.string().trim(),
  priority: z.enum(['Low', 'Medium', 'High']),
  columnId: columnSchema,
  tags: z.array(z.string().trim().min(1)),
  subtasks: z.array(subtaskSchema),
};
const createTaskSchema = z.object({
  title: taskFields.title,
  columnId: taskFields.columnId,
  description: taskFields.description.optional(),
  priority: taskFields.priority.optional(),
  tags: taskFields.tags.optional(),
  subtasks: taskFields.subtasks.optional(),
}).strict();
const updateTaskSchema = z.object({
  title: taskFields.title.optional(),
  description: taskFields.description.optional(),
  priority: taskFields.priority.optional(),
  tags: taskFields.tags.optional(),
}).strict().refine((body) => Object.keys(body).length > 0, 'At least one task field is required');
const moveTaskSchema = z.object({
  columnId: columnSchema,
  orderIndex: z.number().finite(),
  version: z.number().int().nonnegative(),
  operationId: z.string().uuid(),
}).strict();
const addSubtaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
}).strict();
const updateSubtaskSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  completed: z.boolean().optional(),
}).strict().refine((body) => Object.keys(body).length > 0, 'Provide a title or completed value');

const router = Router();

router.get('/', asyncHandler(listTasks));
router.post('/', simulateFailure, validateRequest(createTaskSchema), asyncHandler(createTask));
router.post('/:id/subtasks', simulateFailure, validateObjectId(), validateRequest(addSubtaskSchema), asyncHandler(addSubtask));
router.patch('/:id/subtasks/:subtaskId', simulateFailure, validateObjectId(), validateObjectId('subtaskId'), validateRequest(updateSubtaskSchema), asyncHandler(updateSubtask));
router.delete('/:id/subtasks/:subtaskId', simulateFailure, validateObjectId(), validateObjectId('subtaskId'), asyncHandler(deleteSubtask));
router.patch('/:id/move', simulateFailure, validateObjectId(), validateRequest(moveTaskSchema), asyncHandler(moveTask));
router.patch('/:id', simulateFailure, validateObjectId(), validateRequest(updateTaskSchema), asyncHandler(updateTask));
router.delete('/:id', simulateFailure, validateObjectId(), asyncHandler(deleteTask));

export default router;
