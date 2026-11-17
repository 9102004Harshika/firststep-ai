import mongoose from 'mongoose';

const classificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'classified', 'failed', 'skipped'],
      default: 'pending',
    },
    model: String,
    provider: String,
    promptVersion: String,
    confidence: Number,
    classifiedAt: Date,
    evidence: String,
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    error: String,
    contentHash: String,
  },
  { _id: false },
);

const jobSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true },
    title: { type: String, required: true, index: true },
    company: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    descriptionHtml: { type: String, default: '' },
    location: {
      raw: { type: String, default: '' },
      cities: { type: [String], default: [] },
      country: { type: String, default: 'Unknown' },
    },
    jobUrl: { type: String, required: true },
    canonicalUrl: { type: String, required: true },
    source: { type: String, required: true, index: true },
    sourceBoard: { type: String, required: true },
    sourceRefs: [
      {
        source: String,
        sourceBoard: String,
        externalId: String,
        jobUrl: String,
      },
    ],
    employmentType: { type: String, default: 'Unknown', index: true },
    experienceLevel: { type: String, default: 'Unknown', index: true },
    role: { type: String, default: 'Unknown', index: true },
    fresherEligible: { type: Boolean, default: null, index: true },
    salary: {
      raw: String,
      min: Number,
      max: Number,
      currency: String,
    },
    postedAt: Date,
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active',
      index: true,
    },
    fingerprint: { type: String, required: true },
    raw: { type: mongoose.Schema.Types.Mixed },
    classification: { type: classificationSchema, default: () => ({}) },
    indiaRelevant: { type: Boolean, default: false, index: true },
    geographicEvidence: {
      type: {
        type: String,
        enum: ['city', 'country', 'india_remote', 'multi_location', 'unknown'],
        default: 'unknown',
      },
      matchedText: { type: String, default: '' },
      confidence: { type: Number, default: 0 },
      sourceField: { type: String, default: 'none' },
    },
    geoExclusionReason: { type: String, default: null },
  },
  { timestamps: true },
);

jobSchema.index({ source: 1, externalId: 1 }, { unique: true });
jobSchema.index({ canonicalUrl: 1 }, { unique: true });
jobSchema.index({ fingerprint: 1 });
jobSchema.index({
  title: 'text',
  company: 'text',
  description: 'text',
});

export const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);
