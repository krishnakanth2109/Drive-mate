import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { connectRedis } from './config/redis.js';

import userRoutes from './routes/userRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import rbacRoutes from './routes/rbacRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Allow All CORS
app.use(cors());
app.use(express.json());

// --- Socket.io Setup ---
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Make 'io' accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

import { errorHandler } from './middleware/errorHandler.js';

// --- Routes ---
app.use('/api/users', userRoutes);
app.use('/api/ride', rideRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/rbac', rbacRoutes);

app.get('/api/config/maps-key', (req, res) => {
  res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});

// --- Global Error Handler ---
app.use(errorHandler);

// --- DB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Error:', err));

// --- Redis Connection ---
connectRedis()
  .then(() => console.log('✅ Redis Connected'))
  .catch(err => console.log('❌ Redis Error:', err));

// --- Socket Logic ---
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // 1. Join Personal Room (Crucial for Targeted Notifications)
  // Both Customer and Rider must emit 'join_room' with their MongoDB _id
  socket.on('join_room', (userId) => {
    if(userId) {
        socket.join(userId);
        console.log(`User/Driver joined room: ${userId}`);
    }
  });

  // 2. Join General Drivers Room (Optional fallback)
  socket.on('join_drivers_room', () => {
    socket.join('drivers');
  });

  // 2.5 Join General Customers Room (for nearby driver updates)
  socket.on('join_customers_room', () => {
    socket.join('customers');
  });

  // 3. Join Ride Room (For targeted ride updates)
  socket.on('join_ride', (rideId) => {
    if(rideId) {
        socket.join(`ride_${rideId}`);
        console.log(`Socket ${socket.id} joined ride room: ride_${rideId}`);
    }
  });

  // 4. Driver Location Update -> Send to Ride Room
  socket.on('driver_location_update', (data) => {
    const { rideId, lat, lng, heading } = data;
    // Send to everyone in the ride room (e.g., the customer)
    io.to(`ride_${rideId}`).emit('driver_location_update', {
      lat,
      lng,
      heading
    });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));