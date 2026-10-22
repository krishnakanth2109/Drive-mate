import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    action: { type: String, required: true }, // e.g., ROLE_CREATED, PERMISSION_ADDED
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    targetAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    changes: { type: mongoose.Schema.Types.Mixed }, // Object detailing what changed
    ip: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', AuditLogSchema);
