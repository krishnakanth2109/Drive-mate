import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true }, // e.g., SUPPORT_AGENT
    description: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    isSystem: { type: Boolean, default: false }, // Prevent deletion of system roles
    permissions: [{ type: String }], // Array of specific granular permissions like "customer:read"
    dataAccess: {
      customerPhone: { type: String, enum: ['Full', 'Masked', 'No Access'], default: 'No Access' },
      customerEmail: { type: String, enum: ['Full', 'Masked', 'No Access'], default: 'No Access' },
      driverLocation: { type: String, enum: ['Real-Time', 'Approximate', 'No Access'], default: 'No Access' },
      paymentInfo: { type: String, enum: ['Full Details', 'Limited Details', 'No Access'], default: 'No Access' },
    },
    accessScope: { 
      type: String, 
      enum: ['All Resources', 'Assigned Resources', 'Own Resources', 'Specific Region', 'Specific City'], 
      default: 'All Resources' 
    },
  },
  { timestamps: true }
);

export default mongoose.model('Role', RoleSchema);
