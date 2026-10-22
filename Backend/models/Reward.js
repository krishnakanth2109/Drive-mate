import mongoose from 'mongoose';

const RewardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel', required: true },
    userModel: { type: String, enum: ['Customer', 'Rider'], default: 'Customer' },
    type: { type: String, enum: ['coupon', 'scratch_card', 'bonus', 'incentive'], required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    code: { type: String, default: null }, // Actual code for coupon
    discountValue: { type: Number, default: 0 }, // e.g. 50 (percentage or flat based on logic)
    progress: { type: Number, default: 0 }, // e.g. 8 rides
    target: { type: Number, default: 0 }, // e.g. 15 rides
    rewardAmount: { type: Number, default: 0 }, // e.g. 500 bonus
    validUntil: { type: Date, required: true },
    isLocked: { type: Boolean, default: false }, // Useful for scratch cards
    isUsed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Reward', RewardSchema);
