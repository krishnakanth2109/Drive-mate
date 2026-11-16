import { Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getDistanceFromLatLonInKm } from '../services/locationService.js';

// Generates a 24-character hex ID matching MongoDB ObjectId format for seamless client compatibility
export const generateId = (): string => crypto.randomBytes(12).toString('hex');

export const riderRegister = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, phone, password, vehicleType } = req.body;

  if (!name || !email || !phone || !password) {
    throw new ApiError(400, 'All fields are required.');
  }

  const existingRider = await prisma.rider.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingRider) {
    throw new ApiError(400, 'Rider already exists with this email.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const rider = await prisma.rider.create({
    data: {
      id: generateId(),
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      vehicleType: vehicleType || 'bike',
      currentLng: 0,
      currentLat: 0,
      heading: 0,
    },
  });

  res.status(201).json(new ApiResponse(201, null, 'Rider registered successfully'));
});

export const riderLogin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, phone, password } = req.body;
  const loginInput = (email || phone || '').toLowerCase().trim();

  if (!loginInput || !password) {
    throw new ApiError(400, 'Email/Phone and password are required.');
  }

  const rider = await prisma.rider.findFirst({
    where: {
      OR: [
        { email: loginInput },
        { phone: loginInput },
      ],
    },
  });
  if (!rider) throw new ApiError(400, 'Invalid credentials');

  const isMatch = await bcrypt.compare(password, rider.password);
  if (!isMatch) throw new ApiError(400, 'Invalid credentials');

  const payload = { user: { id: rider.id, role: 'rider' } };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });

  const clientUser = {
    ...rider,
    _id: rider.id,
    currentLocation: {
      type: 'Point',
      coordinates: [rider.currentLng ?? 0, rider.currentLat ?? 0],
      heading: rider.heading,
    },
  };

  res.status(200).json(new ApiResponse(200, { token, user: clientUser }, 'Login successful'));
});

export const customerRegister = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    throw new ApiError(400, 'All fields are required.');
  }

  const existingCustomer = await prisma.customer.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingCustomer) {
    throw new ApiError(400, 'Customer already exists with this email.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await prisma.customer.create({
    data: {
      id: generateId(),
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
    },
  });

  res.status(201).json(new ApiResponse(201, null, 'Customer registered successfully'));
});

export const customerLogin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, phone, password } = req.body;
  const loginInput = (email || phone || '').toLowerCase().trim();

  if (!loginInput || !password) {
    throw new ApiError(400, 'Email/Phone and password are required.');
  }

  let customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { email: loginInput },
        { phone: loginInput },
      ],
    },
  });

  // Auto-seed standard demo customer if requested
  if (!customer && (loginInput === 'customer@drivemate.in' || loginInput === 'demo@drivemate.in' || loginInput === 'neha.sharma@example.com')) {
    const salt = await bcrypt.genSalt(10);
    const demoHashed = await bcrypt.hash(password || 'admin123', salt);
    customer = await prisma.customer.create({
      data: {
        id: generateId(),
        name: 'Pooja Hegde',
        email: loginInput,
        phone: '+919884522109',
        password: demoHashed,
        role: 'customer',
        walletBalance: 450.0,
      },
    });
  }

  if (!customer) throw new ApiError(400, 'Invalid credentials');

  if (!customer.password) throw new ApiError(400, 'Invalid credentials. Please register again.');

  const isMatch = await bcrypt.compare(password, customer.password);
  if (!isMatch) throw new ApiError(400, 'Invalid credentials');

  const payload = { user: { id: customer.id, role: 'customer' } };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });

  const clientUser = {
    ...customer,
    _id: customer.id,
  };

  res.status(200).json(new ApiResponse(200, { token, user: clientUser }, 'Login successful'));
});

export const updateLocation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { lat, lng, heading } = req.body;
  const riderId = req.user.id || req.user._id;

  const rider = await prisma.rider.update({
    where: { id: riderId },
    data: {
      currentLat: parseFloat(lat),
      currentLng: parseFloat(lng),
      heading: heading ? parseFloat(heading) : 0,
      isAvailable: true,
    },
  });

  if (!rider) throw new ApiError(404, 'Rider not found');

  if (req.io) {
    req.io.to('customers').emit('available_driver_location', {
      driverId: rider.id,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      heading: heading ? parseFloat(heading) : 0,
      vehicleType: rider.vehicleType || 'bike',
    });
  }

  res.status(200).json(new ApiResponse(200, null, 'Location updated'));
});

export const setOffline = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const riderId = req.user.id || req.user._id;
  await prisma.rider.update({
    where: { id: riderId },
    data: { isAvailable: false },
  });
  res.status(200).json(new ApiResponse(200, null, 'Rider set offline'));
});

export const getNearbyRiders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { lat, lng } = req.query as { lat?: string; lng?: string };

  if (!lat || !lng) throw new ApiError(400, 'Lat/Lng required');

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  const availableRiders = await prisma.rider.findMany({
    where: { isAvailable: true },
  });

  // Calculate distance using Haversine formula (<= 5 km)
  const nearby = availableRiders
    .filter((r) => {
      if (r.currentLat == null || r.currentLng == null) return false;
      const dist = getDistanceFromLatLonInKm(userLat, userLng, r.currentLat, r.currentLng);
      return dist <= 5;
    })
    .map((r) => ({
      ...r,
      _id: r.id,
      currentLocation: {
        type: 'Point',
        coordinates: [r.currentLng, r.currentLat],
        heading: r.heading,
      },
    }));

  res.status(200).json(new ApiResponse(200, nearby, 'Nearby riders fetched successfully'));
});
