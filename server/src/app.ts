import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { config } from './config';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { searchController } from './controllers/search.controller';

// Route imports
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import propertyRoutes from './routes/property.routes';
import searchRoutes from './routes/search.routes';
import wishlistRoutes from './routes/wishlist.routes';
import savedSearchRoutes from './routes/savedSearch.routes';
import brokerRoutes from './routes/broker.routes';
import inquiryRoutes from './routes/inquiry.routes';
import leadRoutes from './routes/lead.routes';
import visitRoutes from './routes/visit.routes';
import availabilityRoutes from './routes/availability.routes';
import leaseRecordRoutes from './routes/leaseRecord.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', generalLimiter);

// Static files - serve uploads
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/saved-searches', savedSearchRoutes);
app.use('/api/v1/brokers', brokerRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/availability', availabilityRoutes);
app.use('/api/v1/lease-records', leaseRecordRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Property detail route (public, with optional auth)
app.get('/api/v1/properties/:id/detail', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const { authenticate } = require('./middleware/auth');
    authenticate(req, res, () => searchController.getDetail(req, res, next));
  } else {
    searchController.getDetail(req, res, next);
  }
});

// API docs placeholder
app.get('/api/docs', (_req, res) => {
  res.json({
    openapi: '3.0.0',
    info: { title: 'EstateFlow API', version: '1.0.0', description: 'Real estate management platform API' },
    servers: [{ url: '/api/v1' }],
    note: 'Full OpenAPI spec available at /api/docs/spec',
  });
});

// 404 handler for API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'API endpoint not found' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
