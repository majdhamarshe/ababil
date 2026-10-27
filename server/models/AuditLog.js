import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: String, default: 'system', maxlength: 160 },
    action: { type: String, required: true, maxlength: 100 },
    entityType: { type: String, required: true, maxlength: 50 },
    entityId: { type: String, default: '', maxlength: 80 },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '', maxlength: 100 },
  },
  { timestamps: true }
);
auditLogSchema.index({ createdAt: -1 });
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
