import mongoose from 'mongoose';

const resumeTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['modern', 'classic', 'minimal', 'technical'],
      unique: true,
    },
    description: String,
    structure: {
      sections: [String], // Order of sections
      fonts: {
        heading: String,
        body: String,
      },
      spacing: {
        sectionMargin: Number,
        lineHeight: Number,
      },
    },
    atsCompliant: {
      type: Boolean,
      default: true,
    },
    format: String, // 'single-column'
    css: String, // CSS for rendering
    htmlTemplate: String,
  },
  { timestamps: true }
);

export default mongoose.model('ResumeTemplate', resumeTemplateSchema);
