import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'customer' },
    walletBalance: { type: Number, default: 0 },
    coinBalance: { type: Number, default: 0 },
    powerPass: {
      isActive: { type: Boolean, default: false },
      planName: { type: String, default: null },
      validUntil: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Customer', CustomerSchema);
