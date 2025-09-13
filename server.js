const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import configurations and utilities
const connectDB = require('./config/database');
const { demoStats } = require('./utils/demoData');

// Use real authentication with MongoDB
console.log('🔄 Using real authentication with MongoDB');
const authRoutes = require('./routes/auth');
const { authenticateToken } = require('./middleware/auth');

// Connect to MongoDB in background (optional)
connectDB().catch(() => {
  console.log('ℹ️ MongoDB not available - using demo mode');
});

const app = express();
const server = http.createServer(app);

// Socket.IO setup with authentication
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Initialize Fuel Sync Scheduler
const FuelSyncScheduler = require('./services/fuelSyncScheduler');
const fuelScheduler = new FuelSyncScheduler();

// Start fuel sync scheduler if enabled
if (process.env.NODE_ENV !== 'test') {
  fuelScheduler.start();
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false,
  frameguard: false, // Allow iframe embedding for PDF viewing
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// User management routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Driver routes (for real data)
const driverRoutes = require('./routes/drivers');
app.use('/api/drivers', driverRoutes);

// Load routes (for real data)
const loadRoutes = require('./routes/loads');
app.use('/api/loads', loadRoutes);

// Fuel routes (for WEX SFTP integration)
const fuelRoutes = require('./routes/fuel');
app.use('/api/fuel', fuelRoutes);

// ELD routes (for ELD web token integration)
const eldRoutes = require('./routes/eld');
app.use('/api/eld', eldRoutes);

// Dashboard stats endpoint (fallback to demo data)
app.get('/api/dashboard/stats', (req, res) => {
  res.json(demoStats);
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const JWTUtils = require('./utils/jwt');
    const User = require('./models/User');
    
    const decoded = JWTUtils.verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return next(new Error('Authentication error: Invalid user'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ User ${socket.user.email} connected via WebSocket`);

  // Join user-specific room
  socket.join(`user_${socket.user._id}`);
  
  // Join role-specific rooms
  socket.join(`role_${socket.user.role}`);

  // Handle real-time location updates (for drivers)
  socket.on('location_update', (data) => {
    if (socket.user.role === 'driver') {
      // Broadcast location update to administrators and dispatchers
      socket.to('role_admin').to('role_dispatcher').emit('driver_location_update', {
        driverId: socket.user._id,
        driverName: socket.user.fullName,
        location: data.location,
        timestamp: new Date()
      });
    }
  });

  // Handle trip status updates
  socket.on('trip_status_update', (data) => {
    // Broadcast to relevant users based on trip data
    io.emit('trip_update', {
      tripId: data.tripId,
      status: data.status,
      timestamp: new Date(),
      updatedBy: socket.user._id
    });
  });

  // Handle notifications
  socket.on('send_notification', (data) => {
    if (socket.user.role === 'admin' || socket.user.role === 'dispatcher') {
      // Send notification to specific user or role
      if (data.targetUserId) {
        socket.to(`user_${data.targetUserId}`).emit('notification', {
          message: data.message,
          type: data.type || 'info',
          from: socket.user.fullName,
          timestamp: new Date()
        });
      } else if (data.targetRole) {
        socket.to(`role_${data.targetRole}`).emit('notification', {
          message: data.message,
          type: data.type || 'info',
          from: socket.user.fullName,
          timestamp: new Date()
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User ${socket.user.email} disconnected`);
  });

  socket.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
🚛 Absolute TMS Server Started
🌐 Server running on port ${PORT}
📱 Environment: ${process.env.NODE_ENV || 'development'}
🔄 WebSocket support: Enabled
🛡️  Security: Enhanced with Helmet
📊 Rate limiting: Active
🗄️  Database: MongoDB with fallback
⚡ Compression: Enabled
📝 Logging: ${process.env.NODE_ENV !== 'production' ? 'Development mode' : 'Production mode'}

🔑 Demo Credentials:
   Admin: admin@absolutetms.com / demo123
   Driver: john.driver@absolutetms.com / demo123

📋 API Endpoints:
   Health: http://localhost:${PORT}/health
   Auth: http://localhost:${PORT}/api/auth/*
   Dashboard: http://localhost:${PORT}/api/dashboard/stats

🎯 Ready for professional deployment!
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  fuelScheduler.stop();
  server.close(() => {
    console.log('📴 Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  fuelScheduler.stop();
  server.close(() => {
    console.log('📴 Process terminated');
  });
});

module.exports = { app, server, io };