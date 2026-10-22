import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel', required: true },
    userModel: { type: String, enum: ['Customer', 'Rider'], default: 'Customer' },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['INR', 'COINS', 'USD'], default: 'INR', required: true },
    description: { type: String, required: true },
    referenceId: { type: String, default: null } // e.g. ride ID, promo code, etc.
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', TransactionSchema);
