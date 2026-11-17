import mongoose from 'mongoose';

const evaluationLabelSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, unique: true },
    originalTitle: String,
    company: String,
    originalDescription: String,
    aiRole: String,
    aiCities: [String],
    aiExperience: String,
    aiFresherEligible: Boolean,
    humanRole: String,
    humanCities: [String],
    humanExperience: String,
    humanFresherEligible: Boolean,
    evaluationStatus: {
      type: String,
      enum: ['pending', 'labeled', 'excluded'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export const EvaluationLabel =
  mongoose.models.EvaluationLabel || mongoose.model('EvaluationLabel', evaluationLabelSchema);
