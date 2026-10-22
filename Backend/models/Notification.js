import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel', required: true },
    userModel: { type: String, enum: ['Customer', 'Rider'], default: 'Customer' },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ['promo', 'ride', 'system', 'claim', 'payout', 'bonus'], default: 'system' },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Notification', NotificationSchema);
