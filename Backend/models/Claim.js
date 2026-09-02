import mongoose from 'mongoose';

const ClaimSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', default: null }, // Optional, claim might be general
    type: { type: String, enum: ['lost_item', 'insurance', 'dispute', 'other'], required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'rejected'], default: 'open' }
  },
  { timestamps: true }
);

export default mongoose.model('Claim', ClaimSchema);
