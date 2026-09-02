import mongoose from 'mongoose';

const RewardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    type: { type: String, enum: ['coupon', 'scratch_card'], required: true },
    title: { type: String, required: true },
    code: { type: String, default: null }, // Actual code for coupon
    discountValue: { type: Number, required: true }, // e.g. 50 (percentage or flat based on logic)
    validUntil: { type: Date, required: true },
    isLocked: { type: Boolean, default: false }, // Useful for scratch cards
    isUsed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Reward', RewardSchema);
