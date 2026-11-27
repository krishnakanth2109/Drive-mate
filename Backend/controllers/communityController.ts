import { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const generateId = (): string => crypto.randomBytes(12).toString('hex');

// Seed starter community posts if empty
const SEED_COMMUNITY_POSTS = [
  {
    id: 'POST-001',
    authorName: 'Rohan Deshmukh',
    authorProfession: 'Staff Software Architect',
    authorCompany: 'Google India',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    city: 'Bangalore',
    fromLocation: 'Koramangala 5th Block (Near Sony Signal)',
    toLocation: 'Outer Ring Road (Google RMZ Ecoworld)',
    departureTime: '08:45 AM',
    returnTime: '06:15 PM',
    days: 'Mon - Fri',
    vehicleType: 'Car',
    seatsAvailable: 3,
    fuelShareCost: 75.00,
    preferences: 'AC on • Instrumental Lo-Fi • Non-smoking • Tech talks welcome',
    status: 'active',
  },
  {
    id: 'POST-002',
    authorName: 'Dr. Shruti Nair',
    authorProfession: 'Cardiologist',
    authorCompany: 'Manipal Hospitals',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    city: 'Bangalore',
    fromLocation: 'Indiranagar 100ft Road',
    toLocation: 'Old Airport Road Hospital Complex',
    departureTime: '07:30 AM',
    returnTime: '04:00 PM',
    days: 'Mon - Sat',
    vehicleType: 'EV Car',
    seatsAvailable: 2,
    fuelShareCost: 50.00,
    preferences: 'Quiet ride • EV Tata Nexon • Coffee stop friendly',
    status: 'active',
  },
  {
    id: 'POST-003',
    authorName: 'Arjun Mehta',
    authorProfession: 'VP of Product',
    authorCompany: 'Razorpay',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    city: 'Bangalore',
    fromLocation: 'HSR Layout Sector 2',
    toLocation: 'Whitefield ITPL Tech Hub',
    departureTime: '09:00 AM',
    returnTime: '07:00 PM',
    days: 'Mon - Thu',
    vehicleType: 'SUV',
    seatsAvailable: 4,
    fuelShareCost: 110.00,
    preferences: 'Spacious Creta • Highway FASTag express • Podcast lovers',
    status: 'active',
  },
  {
    id: 'POST-004',
    authorName: 'Ananya Sen',
    authorProfession: 'UX Lead',
    authorCompany: 'Microsoft',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    city: 'Hyderabad',
    fromLocation: 'Gachibowli Cyber Towers',
    toLocation: 'Hitech City Phase 2',
    departureTime: '08:30 AM',
    returnTime: '05:45 PM',
    days: 'Mon - Fri',
    vehicleType: 'Car',
    seatsAvailable: 3,
    fuelShareCost: 60.00,
    preferences: 'Women preferred • Gentle AC • Clean interior',
    status: 'active',
  },
  {
    id: 'POST-005',
    authorName: 'Vikram Joshi',
    authorProfession: 'Quant Analyst',
    authorCompany: 'Morgan Stanley',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    city: 'Mumbai',
    fromLocation: 'Powai Hiranandani',
    toLocation: 'Bandra Kurla Complex (BKC)',
    departureTime: '08:15 AM',
    returnTime: '06:30 PM',
    days: 'Mon - Fri',
    vehicleType: 'Car',
    seatsAvailable: 2,
    fuelShareCost: 90.00,
    preferences: 'Toll share via FASTag • Spotify music • Punctual departures',
    status: 'active',
  },
];

/**
 * Get community ride share posts with city filter and search
 * GET /api/community/posts
 */
export const getCommunityPosts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { city, search, vehicleType } = req.query;

  const whereClause: any = {
    status: 'active',
  };

  if (city && city !== 'all' && city !== 'All Cities') {
    whereClause.city = { equals: String(city), mode: 'insensitive' };
  }

  if (vehicleType && vehicleType !== 'all') {
    whereClause.vehicleType = String(vehicleType);
  }

  if (search) {
    const s = String(search).toLowerCase();
    whereClause.OR = [
      { fromLocation: { contains: s, mode: 'insensitive' } },
      { toLocation: { contains: s, mode: 'insensitive' } },
      { authorName: { contains: s, mode: 'insensitive' } },
      { authorCompany: { contains: s, mode: 'insensitive' } },
      { authorProfession: { contains: s, mode: 'insensitive' } },
    ];
  }

  const posts = await prisma.communityRidePost.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profession: true,
          company: true,
          city: true,
          avatarUrl: true,
        },
      },
    },
  });

  res.status(200).json(new ApiResponse(200, posts, 'Community ride posts retrieved successfully'));
});

/**
 * Post a ride daily to community feed
 * POST /api/community/posts
 */
export const createCommunityPost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.user?._id;
  const {
    fromLocation,
    toLocation,
    departureTime,
    returnTime,
    days,
    vehicleType = 'Car',
    seatsAvailable = 3,
    fuelShareCost = 60,
    preferences,
    city = 'Bangalore',
  } = req.body;

  if (!fromLocation || !toLocation || !departureTime) {
    throw new ApiError(400, 'From location, To destination, and Departure time are required.');
  }

  // Find author profile
  let author: any = null;
  if (userId) {
    author = await prisma.customer.findUnique({ where: { id: String(userId) } });
  }

  const authorName = author ? author.name : (req.body.authorName || 'DriveMate Member');
  const authorProfession = author ? author.profession : (req.body.authorProfession || 'Tech Professional');
  const authorCompany = author ? author.company : (req.body.authorCompany || 'Verified Org');
  const authorPhone = author ? author.phone : req.body.authorPhone;
  const authorAvatar = author ? author.avatarUrl : null;

  const newPost = await prisma.communityRidePost.create({
    data: {
      id: generateId(),
      authorId: author?.id || (await prisma.customer.findFirst())?.id || generateId(),
      authorName,
      authorPhone,
      authorProfession,
      authorCompany,
      authorAvatar,
      city: city || author?.city || 'Bangalore',
      fromLocation,
      toLocation,
      departureTime,
      returnTime: returnTime || null,
      days: days || 'Mon - Fri',
      vehicleType,
      seatsAvailable: Number(seatsAvailable) || 3,
      fuelShareCost: fuelShareCost ? Number(fuelShareCost) : null,
      preferences: preferences || 'Clean vehicle • Punctual pickup',
      status: 'active',
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          profession: true,
          company: true,
          city: true,
        },
      },
    },
  });

  // Broadcast new post via Socket.IO if attached
  if (req.io) {
    req.io.emit('community:new_post', newPost);
  }

  res.status(201).json(new ApiResponse(201, newPost, 'Daily commute ride posted to community successfully!'));
});

/**
 * Get community member profiles for networking
 * GET /api/community/profiles
 */
export const getCommunityProfiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || req.user?._id;
  const { city } = req.query;

  const whereClause: any = {};
  if (currentUserId) {
    whereClause.id = { not: String(currentUserId) };
  }
  if (city && city !== 'all' && city !== 'All Cities') {
    whereClause.city = { equals: String(city), mode: 'insensitive' };
  }

  const profiles = await prisma.customer.findMany({
    where: whereClause,
    take: 30,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      profession: true,
      company: true,
      industry: true,
      city: true,
      purpose: true,
      avatarUrl: true,
      bio: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  res.status(200).json(new ApiResponse(200, profiles, 'Community profiles retrieved successfully'));
});

/**
 * Connect with a member profile
 * POST /api/community/connect/:id
 */
export const connectUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || req.user?._id;
  const targetUserId = req.params.id;

  if (!currentUserId) {
    throw new ApiError(401, 'Please log in to connect with members');
  }

  if (currentUserId === targetUserId) {
    throw new ApiError(400, 'Cannot connect with yourself');
  }

  // Check if connection already exists
  let connection = await prisma.userConnection.findFirst({
    where: {
      OR: [
        { requesterId: String(currentUserId), recipientId: String(targetUserId) },
        { requesterId: String(targetUserId), recipientId: String(currentUserId) },
      ],
    },
  });

  if (!connection) {
    connection = await prisma.userConnection.create({
      data: {
        id: generateId(),
        requesterId: String(currentUserId),
        recipientId: String(targetUserId),
        status: 'connected',
      },
    });
  }

  res.status(200).json(new ApiResponse(200, connection, 'Successfully connected! You can now send direct messages.'));
});

/**
 * Get active user connections
 * GET /api/community/connections
 */
export const getUserConnections = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || req.user?._id;

  if (!currentUserId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const connections = await prisma.userConnection.findMany({
    where: {
      OR: [{ requesterId: String(currentUserId) }, { recipientId: String(currentUserId) }],
      status: 'connected',
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          profession: true,
          company: true,
          city: true,
          avatarUrl: true,
        },
      },
      recipient: {
        select: {
          id: true,
          name: true,
          profession: true,
          company: true,
          city: true,
          avatarUrl: true,
        },
      },
    },
  });

  const connectedUsers = connections.map((c) => {
    return c.requesterId === String(currentUserId) ? c.recipient : c.requester;
  });

  res.status(200).json(new ApiResponse(200, connectedUsers, 'User connections retrieved successfully'));
});

/**
 * Get direct messages between current user and a connected peer
 * GET /api/community/messages/:recipientId
 */
export const getDirectMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || req.user?._id;
  const recipientId = req.params.recipientId;

  if (!currentUserId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: String(currentUserId), receiverId: String(recipientId) },
        { senderId: String(recipientId), receiverId: String(currentUserId) },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  res.status(200).json(new ApiResponse(200, messages, 'Messages retrieved successfully'));
});

/**
 * Send direct message to a user
 * POST /api/community/messages/:recipientId
 */
export const sendDirectMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || req.user?._id;
  const recipientId = req.params.recipientId;
  const { message } = req.body;

  if (!currentUserId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!message || !message.trim()) {
    throw new ApiError(400, 'Message text is required');
  }

  const newMessage = await prisma.directMessage.create({
    data: {
      id: generateId(),
      senderId: String(currentUserId),
      receiverId: String(recipientId),
      message: message.trim(),
      isRead: false,
    },
  });

  // Emit to recipient socket room
  if (req.io) {
    req.io.to(String(recipientId)).emit('community:message', newMessage);
  }

  res.status(201).json(new ApiResponse(201, newMessage, 'Message sent successfully'));
});
