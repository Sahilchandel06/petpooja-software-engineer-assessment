import mongoose from 'mongoose';

const { Schema } = mongoose;

const subtaskSchema = new Schema({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
}, { _id: true });

const taskSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, default: '' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  columnId: { type: String, enum: ['todo', 'in-progress', 'done'], required: true },
  orderIndex: { type: Number, required: true },
  tags: { type: [{ type: String, trim: true }], default: [] },
  subtasks: { type: [subtaskSchema], default: [] },
  version: { type: Number, default: 0 },
}, { timestamps: true });

// This index supports reading cards in their column order without scanning unrelated tasks.
taskSchema.index({ columnId: 1, orderIndex: 1 });

export default mongoose.model('Task', taskSchema);
