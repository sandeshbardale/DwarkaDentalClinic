const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['create', 'update', 'delete', 'login', 'export'], required: true },
    collectionName: { type: String, required: true, trim: true },
    documentId: { type: mongoose.Schema.Types.ObjectId },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
