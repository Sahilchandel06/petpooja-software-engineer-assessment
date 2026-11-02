import { Router } from 'express';
import { z } from 'zod';
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
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
  subtasks: taskFields.subtasks.optional(),
}).strict().refine((body) => Object.keys(body).length > 0, 'At least one task field is required');

const router = Router();

router.get('/', asyncHandler(listTasks));
router.post('/', simulateFailure, validateRequest(createTaskSchema), asyncHandler(createTask));
router.patch('/:id', simulateFailure, validateObjectId(), validateRequest(updateTaskSchema), asyncHandler(updateTask));
router.delete('/:id', simulateFailure, validateObjectId(), asyncHandler(deleteTask));

// TODO(step 4): add the dedicated /move endpoint for ordered column transitions.

export default router;
