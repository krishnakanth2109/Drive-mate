import mongoose from 'mongoose';

const RideSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rider',
      default: null,
    },

    pickup: {
      address: String,
      lat: Number,
      lng: Number,
    },
    drop: {
      address: String,
      lat: Number,
      lng: Number,
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'],
      default: 'pending',
    },

    // Vehicle type chosen by customer
    vehicleType: {
      type: String,
      enum: ['bike', 'scooty', 'auto', 'car'],
      default: 'bike',
    },

    fare: { type: Number, required: true },
    distance: { type: Number }, // km
    duration: { type: Number }, // mins
    polyline: { type: String },
    otp: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Ride', RideSchema);