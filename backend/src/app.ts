import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

const app: Express = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS configuration
const corsOrigins = env.NODE_ENV === 'development'
  ? [...env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']
  : env.CLIENT_URL;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

// Body parsing with size limit
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Request logging (skip in test)
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global rate limiter: 300 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
  keyGenerator: (req) => req.ip || 'unknown',
});
app.use(globalLimiter);

// Login rate limiter: 10 failed requests per 15 minutes per IP (skip successful logins)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
  keyGenerator: (req) => req.ip || 'unknown',
});

// Registration rate limiter: 10 requests per hour per IP (counts all attempts)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many registration attempts, please try again later.' },
  keyGenerator: (req) => req.ip || 'unknown',
});

// Apply rate limiters to auth routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/student/login', loginLimiter);
app.use('/api/auth/staff/login', loginLimiter);
app.use('/api/auth/admin/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

export default app;