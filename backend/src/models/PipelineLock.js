import mongoose from 'mongoose';

const pipelineLockSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    token: { type: String, required: true },
    owner: String,
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

export const PipelineLock =
  mongoose.models.PipelineLock || mongoose.model('PipelineLock', pipelineLockSchema);
