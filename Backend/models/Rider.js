import mongoose from 'mongoose';

const RiderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'rider' },

    // RIDER SPECIFIC
    isAvailable: { type: Boolean, default: false },

    // What type of vehicle the rider operates
    vehicleType: {
      type: String,
      enum: ['bike', 'scooty', 'auto', 'car'],
      default: 'bike',
    },

    // GEOSPATIAL DATA
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      heading: { type: Number, default: 0 },
    },

    vehicle: {
      model: { type: String, default: 'Honda Activa' },
      plate: { type: String, default: 'KA-01-AB-1234' },
    },
  },
  { timestamps: true }
);

// 2dsphere index enables $near queries
RiderSchema.index({ currentLocation: '2dsphere' });

export default mongoose.model('Rider', RiderSchema);
