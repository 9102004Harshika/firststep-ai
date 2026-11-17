import mongoose from 'mongoose';

const classificationRunSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['running', 'success', 'partial', 'failed'],
      default: 'running',
    },
    trigger: { type: String, default: 'manual' },
    provider: String,
    model: String,
    promptVersion: String,
    startedAt: { type: Date, default: Date.now },
    finishedAt: Date,
    totals: {
      attempted: { type: Number, default: 0 },
      succeeded: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      inputTokens: { type: Number, default: 0 },
      outputTokens: { type: Number, default: 0 },
      estimatedCost: { type: Number, default: 0 },
    },
    error: String,
  },
  { timestamps: true },
);

export const ClassificationRun =
  mongoose.models.ClassificationRun ||
  mongoose.model('ClassificationRun', classificationRunSchema);
