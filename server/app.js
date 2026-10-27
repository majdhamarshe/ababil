import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import restockRoutes from './routes/restockRoutes.js';
import { errorHandler, notFound } from './middlewares/error.js';

export function createApp() {
  const app = express();
  const allowedOrigins = (
    process.env.CLIENT_URL || 'http://127.0.0.1:5173,http://localhost:5173'
  )
    .split(',')
    .map((item) => item.trim());
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin(origin, done) {
        const isVsCodePreview = origin?.startsWith('vscode-webview://');
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          (process.env.NODE_ENV !== 'production' && isVsCodePreview)
        )
          return done(null, true);
        return done(new Error('CORS origin is not allowed.'));
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json({ limit: '150kb' }));
  app.use((req, res, next) => {
    const unsafe = (value) =>
      value &&
      typeof value === 'object' &&
      Object.entries(value).some(
        ([key, child]) =>
          key.startsWith('$') || key.includes('.') || unsafe(child)
      );
    if (unsafe(req.body) || unsafe(req.query))
      return res.status(400).json({ message: 'بيانات الطلب غير مسموحة.' });
    return next();
  });
  app.use('/uploads', express.static(path.resolve('server/uploads')));
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });
  const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'محاولات كثيرة، يرجى المحاولة لاحقًا.' },
  });
  const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'طلبات كثيرة، يرجى المحاولة لاحقًا.' },
  });
  app.use('/api', apiLimiter);
  app.use('/api/auth/login', sensitiveLimiter);
  app.use('/api/orders', (req, res, next) =>
    req.method === 'POST' ? orderLimiter(req, res, next) : next()
  );
  app.use('/api/restock-requests', (req, res, next) =>
    req.method === 'POST' ? sensitiveLimiter(req, res, next) : next()
  );
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/system', systemRoutes);
  app.use('/api/restock-requests', restockRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
