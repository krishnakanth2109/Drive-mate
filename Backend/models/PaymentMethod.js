import mongoose from 'mongoose';

const PaymentMethodSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel', required: true },
    userModel: { type: String, enum: ['Customer', 'Rider'], default: 'Customer' },
    type: { type: String, enum: ['UPI', 'Credit Card', 'Debit Card', 'Wallet', 'Bank Account'], required: true },
    provider: { type: String, required: true }, // e.g., 'Paytm', 'Amazon Pay', 'HDFC', 'Chase Checking', 'SBI'
    last4: { type: String, default: null }, // e.g., '1234' for cards/accounts, or VPA for UPI
    accountNumber: { type: String, default: null },
    ifscOrRouting: { type: String, default: null },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('PaymentMethod', PaymentMethodSchema);
