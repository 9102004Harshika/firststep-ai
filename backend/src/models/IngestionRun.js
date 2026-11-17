import mongoose from 'mongoose';

const sourceResultSchema = new mongoose.Schema(
  {
    employer: String,
    provider: String,
    boardId: String,
    ok: Boolean,
    fetched: { type: Number, default: 0 },
    error: String,
    durationMs: Number,
  },
  { _id: false },
);

const ingestionRunSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['running', 'success', 'partial', 'failed'],
      default: 'running',
      index: true,
    },
    trigger: {
      type: String,
      enum: ['manual', 'cron', 'script', 'admin'],
      default: 'manual',
    },
    startedAt: { type: Date, default: Date.now },
    finishedAt: Date,
    totals: {
      fetched: { type: Number, default: 0 },
      valid: { type: Number, default: 0 },
      newRecords: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      duplicates: { type: Number, default: 0 },
      rejected: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    sourceResults: [sourceResultSchema],
    error: String,
    lockToken: String,
  },
  { timestamps: true },
);

export const IngestionRun =
  mongoose.models.IngestionRun || mongoose.model('IngestionRun', ingestionRunSchema);
