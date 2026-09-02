import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import userRoutes from './routes/userRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

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

// --- Routes ---
app.use('/api/users', userRoutes);
app.use('/api/ride', rideRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/config/maps-key', (req, res) => {
  res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});

// --- DB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Error:', err));

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

  // 3. Driver Location Update -> Send to Customer
  socket.on('driver_location_update', (data) => {
    const { customerId, lat, lng, heading } = data;
    // Send directly to the specific customer
    io.to(customerId).emit('driver_location_update', {
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