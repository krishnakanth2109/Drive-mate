import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import { connectRedis } from './config/redis.js';
import { connectPrisma, disconnectPrisma, prisma } from './config/prisma.js';

import userRoutes from './routes/userRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import rbacRoutes from './routes/rbacRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import riderRoutes from './routes/riderRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

// Declare global extension for Express Request to attach Socket.io instance
declare global {
  namespace Express {
    interface Request {
      io?: Server;
    }
  }
}

const app: Express = express();
const server = http.createServer(app);

// Allow All CORS
app.use(cors());
app.use(express.json());

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
app.use('/api/users', userRoutes);
app.use('/api/ride', rideRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/payment', paymentRoutes);

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

  res.json({
    status: 'ok',
    services: {
      neonPostgres: pgStatus,
      redis: 'connected (mocked/in-memory)',
    },
    timestamp: new Date().toISOString(),
  });
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

  // 4. Driver Location Update -> Send to Ride Room
  socket.on('driver_location_update', (data: { rideId: string; lat: number; lng: number; heading?: number }) => {
    const { rideId, lat, lng, heading } = data;
    io.to(`ride_${rideId}`).emit('driver_location_update', {
      lat,
      lng,
      heading,
    });
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
