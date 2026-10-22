import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['Approved', 'Pending Review', 'Required'], default: 'Approved' },
  documentNumber: { type: String, default: '' },
  verifiedAt: { type: Date, default: Date.now },
}, { _id: false });

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
      model: { type: String, default: 'Honda Activa 6G' },
      plate: { type: String, default: 'KA-01-AB-1234' },
      year: { type: String, default: '2022' },
      color: { type: String, default: 'Matte Black' },
      insuranceExpiry: { type: String, default: 'Active (12 Aug 2027)' },
      pollutionStatus: { type: String, default: 'Active' },
    },

    walletBalance: { type: Number, default: 3450 },
    rating: { type: Number, default: 4.9 },
    totalRides: { type: Number, default: 24 },
    totalEarnings: { type: Number, default: 3450 },
    loyaltyPoints: { type: Number, default: 350 },
    referralCode: { type: String, default: 'ALEX2025' },

    documents: {
      type: [DocumentSchema],
      default: [
        { id: '1', title: 'Driving License', status: 'Approved', documentNumber: 'DL-2022-90123' },
        { id: '2', title: 'Vehicle RC Book', status: 'Approved', documentNumber: 'RC-KA-01-1234' },
        { id: '3', title: 'Aadhar Card', status: 'Pending Review', documentNumber: 'XXXX-XXXX-9876' },
        { id: '4', title: 'Background Check', status: 'Required', documentNumber: '' },
      ],
    },

    preferences: {
      autoAccept: { type: Boolean, default: false },
      darkMode: { type: Boolean, default: false },
      outstationOptIn: { type: Boolean, default: false },
      navigationApp: { type: String, default: 'Google Maps' },
    },

    resetOtp: { type: String, default: null },
    resetOtpExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

// 2dsphere index enables $near queries
RiderSchema.index({ currentLocation: '2dsphere' });

export default mongoose.model('Rider', RiderSchema);
