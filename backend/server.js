require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/auth.routes');
const jobRoutes = require('./src/routes/job.routes');
const applicationRoutes = require('./src/routes/application.routes');
const uploadRoutes = require('./src/routes/upload.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const { setGetIO } = require('./src/controllers/application.controller');
const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────────
// App + HTTP Server
// ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app); // Socket.io requires the raw http.Server

// ─────────────────────────────────────────────
// Socket.io Setup
// ─────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// JWT auth handshake for WebSocket connections
// Why: prevents anonymous users from receiving private events
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  // Join a private room scoped to this user
  socket.join(`user:${socket.userId}`);
  console.log(`🔌 User ${socket.userId} connected [${socket.id}]`);

  socket.on('notification:mark_read', async (notificationId) => {
    // Handled via REST (PATCH /notifications/:id/read) — WS is just a trigger here
    // Could add DB update here for real-time UX without polling
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User ${socket.userId} disconnected`);
  });
});

// Expose io to services via controller injection (avoids circular imports)
setGetIO(() => io);

// ─────────────────────────────────────────────
// Global Middleware
// ─────────────────────────────────────────────
app.use(helmet());        // Sets secure HTTP headers (XSS, CSP, etc.)
app.use(compression());   // Gzip responses — important for job listing payloads
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' })); // Body size limit — prevents large payload attacks
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting — protects auth endpoints from brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/jobs', apiLimiter, jobRoutes);
app.use('/api/applications', apiLimiter, applicationRoutes);
app.use('/api/upload', apiLimiter, uploadRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);

// Health check — used by AWS ELB/ALB and monitoring tools
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler — catches all unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler — MUST be last
app.use(errorHandler);

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────┐
  │   SyncUp API running on port ${PORT}   │
  │   ENV: ${process.env.NODE_ENV || 'development'}                  │
  │   http://localhost:${PORT}/health      │
  └──────────────────────────────────────┘
  `);
});

// Graceful shutdown — closes DB connections cleanly on SIGTERM (EC2/Docker)
const prisma = require('./src/config/db');
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Don't crash in production — log and continue
});

module.exports = { app, server, io };
