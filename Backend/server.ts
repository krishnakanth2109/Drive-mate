import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import { connectRedis } from './config/redis.js';
import { connectPrisma, disconnectPrisma, prisma } from './config/prisma.js';
import redisService from './services/redisService.js';

import userRoutes from './routes/userRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import rbacRoutes from './routes/rbacRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import riderRoutes from './routes/riderRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import fleetRoutes from './routes/fleetRoutes.js';
import operationsRoutes from './routes/operationsRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import authRoutes from './routes/authRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import driverOnboardingRoutes from './routes/driverOnboardingRoutes.js';
import adminVerificationRoutes from './routes/adminVerificationRoutes.js';
import { initSettlementScheduler } from './services/settlementScheduler.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

// Declare global extension for Express Request to attach Socket.io instance
declare global {
  namespace Express {
    interface Request {
      io?: Server;
      rawBody?: Buffer;
    }
  }
}

const app: Express = express();
const server = http.createServer(app);

// Allow All CORS
app.use(cors());
app.use(
  express.json({
    limit: '100mb',
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Serve uploaded documents statically
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'Backend/uploads')));

// --- Socket.io Setup ---
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Make 'io' accessible in routes
app.use((req: Request, res: Response, next: NextFunction) => {
  req.io = io;
  next();
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ride', rideRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/driver-onboarding', driverOnboardingRoutes);
app.use('/api/verification', driverOnboardingRoutes);
app.use('/api/admin', adminVerificationRoutes);

app.get('/api/config/maps-key', (req: Request, res: Response) => {
  res.json({ key: process.env.GOOGLE_MAPS_API_KEY || '' });
});

app.get('/api/health', async (req: Request, res: Response) => {
  let pgStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1 as health`;
    pgStatus = 'connected';
  } catch (e: any) {
    pgStatus = 'error';
  }

  const redisHealth = redisService.getStatus();

  res.json({
    status: 'ok',
    services: {
      neonPostgres: pgStatus,
      redis: {
        status: redisHealth.connected ? 'connected' : 'disconnected',
        mode: redisHealth.mode,
        isRealRedis: redisHealth.isRealRedis,
        stats: redisHealth.stats,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/redis/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    ...redisService.getStatus(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/redis/active-drivers', async (req: Request, res: Response) => {
  try {
    const drivers = await redisService.getAllActiveDriverLocations();
    res.json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Global Error Handler ---
app.use(errorHandler);

// --- DB Connection via Prisma ORM ---
connectPrisma()
  .then((connected) => {
    if (connected) {
      console.log('✅ Neon PostgreSQL Connected via Prisma');
    } else {
      console.warn('⚠️ Warning: Prisma could not connect to Neon PostgreSQL');
    }
  })
  .catch((err) => console.error('❌ Database Connection Error:', err));

// --- Redis Connection ---
connectRedis()
  .then(() => console.log('✅ Redis Initialized'))
  .catch((err) => console.error('❌ Redis Error:', err));

// --- Weekly Settlement Scheduler ---
initSettlementScheduler();

// --- Socket Logic ---
io.on('connection', (socket: Socket) => {
  console.log('Socket connected:', socket.id);

  // 1. Join Personal Room (Crucial for Targeted Notifications)
  socket.on('join_room', (userId: string) => {
    if (userId) {
      socket.join(userId);
      console.log(`User/Driver joined room: ${userId}`);
    }
  });

  // 2. Join General Drivers Room
  socket.on('join_drivers_room', () => {
    socket.join('drivers');
  });

  // 2.5 Join General Customers Room (for nearby driver updates)
  socket.on('join_customers_room', () => {
    socket.join('customers');
  });

  // 3. Join Ride Room (For targeted ride updates)
  socket.on('join_ride', (rideId: string) => {
    if (rideId) {
      socket.join(`ride_${rideId}`);
      console.log(`Socket ${socket.id} joined ride room: ride_${rideId}`);
    }
  });

  // 4. Driver Location Update -> Send to Ride Room & Fast-cache in Redis
  socket.on('driver_location_update', (data: { rideId: string; riderId?: string; lat: number; lng: number; heading?: number }) => {
    const { rideId, riderId, lat, lng, heading } = data;
    io.to(`ride_${rideId}`).emit('driver_location_update', {
      lat,
      lng,
      heading,
    });

    // Fast-cache driver coordinate into Redis
    const trackingKey = riderId || rideId;
    if (trackingKey && lat != null && lng != null) {
      redisService.storeDriverLocation(trackingKey, lat, lng, heading || 0);
    }
  });

  // 5. Real-time Chat functionality for Ride
  socket.on(
    'send_chat_message',
    (data: { rideId: string; sender: string; text: string; time?: string }) => {
      const { rideId, sender, text, time } = data;
      socket.to(`ride_${rideId}`).emit('receive_chat_message', {
        id: Date.now().toString(),
        sender,
        text,
        time: time || new Date().toISOString(),
      });
    }
  );

  // 6. Real-time Community Direct Messaging between Connected Profiles
  socket.on(
    'community:send_message',
    (data: { senderId: string; receiverId: string; message: string; id?: string }) => {
      io.to(data.receiverId).emit('community:message', {
        id: data.id || Date.now().toString(),
        senderId: data.senderId,
        receiverId: data.receiverId,
        message: data.message,
        createdAt: new Date().toISOString(),
      });
    }
  );

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// --- Graceful Shutdown ---
const gracefulShutdown = async () => {
  console.log('Received shutdown signal, disconnecting Prisma...');
  await disconnectPrisma();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export { app, server, io };
