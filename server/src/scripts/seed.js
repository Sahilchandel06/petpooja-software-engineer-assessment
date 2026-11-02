import 'dotenv/config';
import mongoose from 'mongoose';
import Task from '../models/Task.js';

const sampleTasks = [
  { title: 'Map customer onboarding flow', description: 'Document each step from signup through the first successful order.', priority: 'High', columnId: 'todo', tags: ['research', 'onboarding'], subtasks: [{ title: 'Interview two restaurant owners', completed: true }, { title: 'Draft the flow diagram', completed: false }] },
  { title: 'Collect menu import examples', description: 'Gather spreadsheets with common menu formats and edge cases.', priority: 'Medium', columnId: 'todo', tags: ['data', 'menus'], subtasks: [{ title: 'Collect CSV examples', completed: true }, { title: 'Record edge cases', completed: false }] },
  { title: 'Write API error copy', description: 'Prepare clear, actionable messages for common setup failures.', priority: 'Low', columnId: 'todo', tags: ['content'] },
  { title: 'Review accessibility checklist', description: 'Check keyboard flow and readable labels for the first release.', priority: 'High', columnId: 'todo', tags: ['accessibility', 'quality'], subtasks: [{ title: 'Check keyboard navigation', completed: true }, { title: 'Review form labels', completed: true }] },
  { title: 'Confirm pilot restaurant list', description: 'Coordinate with the field team on the first pilot group.', priority: 'Medium', columnId: 'todo', tags: ['launch', 'operations'] },

  { title: 'Build menu import preview', description: 'Show parsed item names and prices before confirming an import.', priority: 'High', columnId: 'in-progress', tags: ['menus', 'frontend'], subtasks: [{ title: 'Parse CSV rows', completed: true }, { title: 'Show validation warnings', completed: false }, { title: 'Add confirmation action', completed: false }] },
  { title: 'Add order status timeline', description: 'Display preparation and pickup updates in chronological order.', priority: 'Medium', columnId: 'in-progress', tags: ['orders', 'frontend'] },
  { title: 'Tune database indexes', description: 'Measure the main dashboard query and add indexes where needed.', priority: 'High', columnId: 'in-progress', tags: ['performance', 'database'], subtasks: [{ title: 'Capture baseline query plan', completed: true }, { title: 'Add compound index', completed: false }, { title: 'Compare query time', completed: false }] },
  { title: 'Prepare pilot support guide', description: 'Write setup steps and escalation contacts for the launch team.', priority: 'Low', columnId: 'in-progress', tags: ['documentation', 'launch'], subtasks: [{ title: 'List common questions', completed: true }, { title: 'Add escalation contacts', completed: true }, { title: 'Review with support lead', completed: true }] },
  { title: 'Test printer reconnect flow', description: 'Verify that a disconnected kitchen printer can be restored.', priority: 'Medium', columnId: 'in-progress', tags: ['hardware', 'quality'] },

  { title: 'Set up staging environment', description: 'Create a shared staging setup for the product team.', priority: 'High', columnId: 'done', tags: ['infrastructure', 'launch'], subtasks: [{ title: 'Create staging database', completed: true }, { title: 'Add deployment secrets', completed: true }] },
  { title: 'Define order event names', description: 'Agree on event labels used by the order timeline.', priority: 'Low', columnId: 'done', tags: ['orders', 'planning'] },
  { title: 'Create restaurant demo account', description: 'Prepare a sample account for internal product walkthroughs.', priority: 'Medium', columnId: 'done', tags: ['demo', 'operations'] },
  { title: 'Document release checklist', description: 'Record the checks required before a production rollout.', priority: 'Medium', columnId: 'done', tags: ['documentation', 'release'], subtasks: [{ title: 'List smoke checks', completed: true }, { title: 'Add rollback steps', completed: true }, { title: 'Review with engineering', completed: true }] },
  { title: 'Review payment sandbox setup', description: 'Confirm test credentials and successful sandbox transactions.', priority: 'High', columnId: 'done', tags: ['payments', 'quality'] },
].map((task, index) => ({ ...task, orderIndex: (index % 5 + 1) * 1000 }));

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required. Copy server/.env.example to server/.env.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    // This command is an intentional reset so evaluators always get the same sample board.
    await Task.deleteMany({});
    await Task.insertMany(sampleTasks);
    console.info(`Seeded ${sampleTasks.length} tasks across todo, in-progress, and done.`);
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error('Failed to seed TaskFlow:', error.message);
  process.exitCode = 1;
});
