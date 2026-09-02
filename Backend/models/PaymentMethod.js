import mongoose from 'mongoose';

const PaymentMethodSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    type: { type: String, enum: ['UPI', 'Credit Card', 'Debit Card', 'Wallet'], required: true },
    provider: { type: String, required: true }, // e.g., 'Paytm', 'Amazon Pay', 'HDFC'
    last4: { type: String, default: null }, // e.g., '1234' for cards, or VPA for UPI
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('PaymentMethod', PaymentMethodSchema);
