import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import applicationRoutes from './routes/application.routes.js';
import aiRoutes from './routes/ai.routes.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com'
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ai', aiRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
