require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const multer = require('multer');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const logger = require('./middleware/logger');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sendError } = require('./utils/errorHandler');

const authRoutes = require('./routes/authRoutes');
const applianceRoutes = require('./routes/applianceRoutes');
const aiRoutes = require('./routes/aiRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const reportRoutes = require('./routes/reportRoutes');
const diagnosticRoutes = require('./routes/diagnosticRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const usageRoutes = require('./routes/usageRoutes');
const chatRoutes = require('./routes/chatRoutes');
const riskRoutes = require('./routes/riskRoutes');
const iotRoutes = require('./routes/iotRoutes');
const multimodalRoutes = require('./routes/multimodalRoutes');
const ruleRoutes = require('./routes/ruleRoutes');
const desktopAgentRoutes = require('./routes/desktopAgentRoutes');
const userRoutes = require('./routes/userRoutes');
const ruleEngine = require('./services/ruleEngine');

const app = express();
app.disable('x-powered-by');

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));

app.use(mongoSanitize({ replaceWith: '_' }));

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error(' Missing required environment variables: MONGO_URI, JWT_SECRET');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error(' JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your-') || process.env.GEMINI_API_KEY.includes('Demo')) {
  console.warn('WARNING: Gemini API key not configured - AI features will use mock responses');
  console.warn('Get your API key from: https://makersuite.google.com/app/apikey');
}

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:8081',
  'http://10.0.2.2:5000', 
  'http://127.0.0.1:8081',
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/, 
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/, 
  
  /^https:\/\/.*\.onrender\.com$/,
  /\.render\.com$/,
];

const envOrigins = (process.env.CORS_EXTRA_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.some((allowed) =>
        typeof allowed === 'string'
          ? allowed === origin
          : allowed.test(origin),
      ) || envOrigins.includes(origin);

    if (isAllowed) return callback(null, true);
    if (process.env.NODE_ENV === 'development') {

console.warn('[cors] allowing unknown origin in dev:', origin);
      return callback(null, true);
    }
    console.warn('[cors] blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(compression());

app.use(logger);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

app.use((req, res, next) => {

res.setTimeout(60000, () => {
    if (!res.headersSent) {
      sendError(res, 504, 'Request timeout', 'Request took too long');
    }
  });
  next();
});

app.use(generalLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({
    name: 'AI Home Maintenance Assistant API',
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/healthz',
      ready: '/readyz',
      api: '/api',
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/readyz', async (req, res) => {
  try {
    const state = mongoose.connection.readyState; 
    if (state !== 1) {
      return res.status(503).json({ status: 'not_ready', mongo: state });
    }
    return res.json({ status: 'ready', mongo: state });
  } catch (e) {
    return res.status(503).json({ status: 'not_ready', error: 'health check failed' });
  }
});

app.get('/health', (req, res) => res.redirect(301, '/healthz'));

app.use('/api/auth', authRoutes);
app.use('/api/appliances', applianceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/diagnostics', diagnosticRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/desktop-agent', desktopAgentRoutes);
app.use('/api/users', userRoutes);
app.use('/api', multimodalRoutes);

app.use((req, res) => {
  sendError(res, 404, 'Route not found', `${req.method} ${req.path} does not exist`);
});

app.use((err, req, res, next) => {
  
  console.error('[error]', req.method, req.originalUrl, err.stack || err.message || err);

  if (err.name === 'ValidationError') {
    return sendError(res, 400, 'Validation error', err.message);
  }

  if (err.name === 'CastError') {
    return sendError(res, 400, 'Invalid ID format', 'Invalid identifier');
  }

  if (err.code === 11000) {
    return sendError(res, 400, 'Duplicate field', 'This value already exists');
  }

if (err instanceof multer.MulterError || err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FILE_COUNT') {
    const code = err.code || 'LIMIT_UNKNOWN';
    return sendError(res, 413, 'Upload rejected', `Upload constraint violated: ${code}`);
  }
  if (err.message && /unsupported file type|file type/i.test(err.message)) {
    return sendError(res, 415, 'Unsupported file type', err.message);
  }

  if (err.type === 'entity.too.large') {
    return sendError(res, 413, 'Payload too large', 'Request body exceeds the size limit');
  }

  sendError(res, 500, 'Internal server error', 'An error occurred');
});

const connectDB = async (attempt = 1) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true
    });
    console.log('MongoDB connected');
  } catch (error) {
    if (attempt < 5) {
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying connection in ${delay}ms (attempt ${attempt}/5)...`);
      setTimeout(() => connectDB(attempt + 1), delay);
    } else {
      console.error('MongoDB connection failed after 5 attempts');
      process.exit(1);
    }
  }
};

const PORT = process.env.PORT || 5000;

const userRoomBySocket = new WeakMap(); 

const isValidUserId = (id) => typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id);

io.on('connection', (socket) => {

socket.on('join_user_room', (userId) => {

if (!isValidUserId(userId)) return;
    const room = `user_${userId}`;
    socket.join(room);
    let rooms = userRoomBySocket.get(socket);
    if (!rooms) { rooms = new Set(); userRoomBySocket.set(socket, rooms); }
    rooms.add(room);
  });

  socket.on('leave_user_room', (userId) => {
    if (!isValidUserId(userId)) return;
    const room = `user_${userId}`;
    socket.leave(room);
    userRoomBySocket.get(socket)?.delete(room);
  });

  socket.on('disconnect', (reason) => {
    const rooms = userRoomBySocket.get(socket);
    if (rooms) {
      for (const room of rooms) socket.leave(room);
      userRoomBySocket.delete(socket);
    }

if (reason && reason !== 'io client disconnect') {
      console.log(`[socket] disconnect ${socket.id} (${reason})`);
    }
  });
});

connectDB().then(async () => {
  
  try {
    const init = await ruleEngine.initRuleEngine();
    if (init.count) {
      console.log(`Rule engine: ${init.count} builtin rules loaded (${init.upserted} new, ${init.modified} updated)`);
    }
  } catch (e) {
    console.warn('Rule engine init failed:', e.message);
  }

  server.listen(PORT, '0.0.0.0', () => {

console.log(`Server listening on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Socket.IO enabled for real-time updates`);

if (process.env.MQTT_BROKER_URL) {
      try {
        require('./services/mqttIngestionService').init(io);
        console.log('MQTT ingestion enabled');
      } catch (e) {
        console.warn('MQTT init failed:', e.message);
      }
    } else {
      console.log('MQTT disabled (no broker URL)');
    }
  });
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err.stack || err);
  
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {

console.error('[unhandledRejection]', reason && (reason.stack || reason));
});
