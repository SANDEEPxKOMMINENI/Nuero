import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    baseResumeName: {
      type: String,
      required: true,
    },
    baseResumeContent: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    template: {
      type: String,
      enum: ['modern', 'classic', 'minimal', 'technical'],
      default: 'modern',
    },
    selectedLLM: {
      type: String,
      enum: ['gemini', 'gpt4', 'claude', 'mixtral', 'llama2'],
      default: 'gpt4',
    },
    llmModel: {
      type: String,
      default: 'gpt-4-turbo',
    },
    tailoredResumeContent: {
      type: String,
      required: true,
    },
    tailoredResumeJson: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    extractedJobKeywords: {
      type: [String],
      default: [],
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    changes: {
      type: [
        {
          section: String,
          before: String,
          after: String,
          reason: String,
        },
      ],
      default: [],
    },
    wordDocUrl: {
      type: String,
      required: false,
    },
    pdfUrl: {
      type: String,
      required: false,
    },
    promptVariant: {
      type: String,
      required: false,
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Index for faster queries
resumeSchema.index({ userId: 1, createdAt: -1 });
resumeSchema.index({ jobTitle: 1 });

export default mongoose.model('Resume', resumeSchema);
