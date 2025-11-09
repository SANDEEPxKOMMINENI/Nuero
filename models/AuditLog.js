import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'resume_upload',
        'resume_tailor',
        'resume_download',
        'subscription_change',
        'admin_action',
      ],
    },
    details: mongoose.Schema.Types.Mixed,
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: false,
    },
    success: {
      type: Boolean,
      default: true,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
