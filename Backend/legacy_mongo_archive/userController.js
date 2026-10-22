import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Customer from '../models/Customer.js';
import Rider from '../models/Rider.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const riderRegister = asyncHandler(async (req, res) => {
  const { name, email, phone, password, vehicleType } = req.body;

  if (!name || !email || !phone || !password) {
    throw new ApiError(400, 'All fields are required.');
  }

  let rider = await Rider.findOne({ email: email.toLowerCase() });
  if (rider) {
    throw new ApiError(400, 'Rider already exists with this email.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  rider = new Rider({
    name,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    vehicleType: vehicleType || 'bike',
    currentLocation: { type: 'Point', coordinates: [0, 0] },
  });

  await rider.save();
  res.status(201).json(new ApiResponse(201, null, 'Rider registered successfully'));
});

export const riderLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const rider = await Rider.findOne({ email: email.toLowerCase() });
  if (!rider) throw new ApiError(400, 'Invalid credentials');

  const isMatch = await bcrypt.compare(password, rider.password);
  if (!isMatch) throw new ApiError(400, 'Invalid credentials');

  const payload = { user: { id: rider.id, role: 'rider' } };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

  res.status(200).json(new ApiResponse(200, { token, user: rider }, 'Login successful'));
});

export const customerRegister = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  
  if (!name || !email || !phone || !password) {
    throw new ApiError(400, 'All fields are required.');
  }

  let customer = await Customer.findOne({ email: email.toLowerCase() });
  if (customer) {
    throw new ApiError(400, 'Customer already exists with this email.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  customer = new Customer({
    name,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
  });

  await customer.save();
  res.status(201).json(new ApiResponse(201, null, 'Customer registered successfully'));
});

export const customerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const customer = await Customer.findOne({ email: email.toLowerCase() });
  if (!customer) throw new ApiError(400, 'Invalid credentials');

  if (!customer.password) throw new ApiError(400, 'Invalid credentials. Please register again.');

  const isMatch = await bcrypt.compare(password, customer.password);
  if (!isMatch) throw new ApiError(400, 'Invalid credentials');

  const payload = { user: { id: customer.id, role: 'customer' } };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

  res.status(200).json(new ApiResponse(200, { token, user: customer }, 'Login successful'));
});

export const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng, heading } = req.body;

  const rider = await Rider.findByIdAndUpdate(
    req.user.id,
    {
      currentLocation: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
        heading: heading || 0,
      },
      isAvailable: true,
    },
    { new: true }
  );

  if (!rider) throw new ApiError(404, 'Rider not found');

  req.io.to('customers').emit('available_driver_location', {
    driverId: req.user.id,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    heading: heading || 0,
    vehicleType: rider.vehicleType || 'bike',
  });

  res.status(200).json(new ApiResponse(200, null, 'Location updated'));
});

export const setOffline = asyncHandler(async (req, res) => {
  await Rider.findByIdAndUpdate(req.user.id, { isAvailable: false });
  res.status(200).json(new ApiResponse(200, null, 'Rider set offline'));
});

export const getNearbyRiders = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) throw new ApiError(400, 'Lat/Lng required');

  const riders = await Rider.find({
    isAvailable: true,
    currentLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: 5000,
      },
    },
  });

  res.status(200).json(new ApiResponse(200, riders, 'Nearby riders fetched successfully'));
});
