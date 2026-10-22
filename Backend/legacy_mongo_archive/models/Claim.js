import mongoose from 'mongoose';

const ClaimSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel', required: true },
    userModel: { type: String, enum: ['Customer', 'Rider'], default: 'Customer' },
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', default: null }, // Optional, claim might be general
    type: { type: String, enum: ['lost_item', 'insurance', 'dispute', 'fare_issue', 'vehicle_issue', 'account_issue', 'other'], required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'rejected'], default: 'open' }
  },
  { timestamps: true }
);

export default mongoose.model('Claim', ClaimSchema);
