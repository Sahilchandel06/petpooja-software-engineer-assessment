import mongoose from 'mongoose';

const { Schema } = mongoose;

const moveOperationSchema = new Schema({
  operationId: { type: String, required: true, unique: true },
  taskId: { type: Schema.Types.ObjectId, required: true },
  columnId: { type: String, enum: ['todo', 'in-progress', 'done'], required: true },
  orderIndex: { type: Number, required: true },
  resultTask: { type: Schema.Types.Mixed, required: true },
  rebalancedTasks: { type: [Schema.Types.Mixed], default: [] },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

export default mongoose.model('MoveOperation', moveOperationSchema);
