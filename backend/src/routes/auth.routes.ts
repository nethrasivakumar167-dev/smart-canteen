import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import {
  findUserByEmailOrId,
  createNewUser,
  toSafeUser,
  Role,
} from '../services/userService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { env } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

const DUMMY_HASH = '$2a$10$wK1W.Q37fA6V7Kz1mN1Zg.0n6U1w5Q2.u2T7.Y3aK6g7H8i9j0k1l';

const generateToken = (userId: string, email: string, role: Role): string => {
  return jwt.sign({ userId, email, role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN as any,
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new Student account (Public registration is for Students only)
 * @access  Public
 */
router.post('/register', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, confirmPassword, studentId, phone } = req.body;

  // 1. Mandatory field validation
  if (!name || !name.trim()) {
    res.status(400).json({ success: false, error: 'Full name is required.' });
    return;
  }
  if (!email || !email.trim()) {
    res.status(400).json({ success: false, error: 'Campus email address is required.' });
    return;
  }
  if (!password) {
    res.status(400).json({ success: false, error: 'Password is required.' });
    return;
  }

  // 2. Email format validation, lowercase and trim
  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    res.status(400).json({ success: false, error: 'Please enter a valid campus email address.' });
    return;
  }

  // 3. Password validation & confirmation (min 8, max 72 for bcrypt)
  if (password.length < 8 || password.length > 72) {
    res.status(400).json({
      success: false,
      error: 'Password must be between 8 and 72 characters long.',
    });
    return;
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    res.status(400).json({
      success: false,
      error: 'Passwords do not match. Please verify your confirmation password.',
    });
    return;
  }

  // 4. Duplicate prevention
  const existingEmail = await findUserByEmailOrId(normalizedEmail);
  if (existingEmail) {
    res.status(409).json({
      success: false,
      error: 'An account with this email address already exists. Please sign in.',
    });
    return;
  }

  if (studentId && studentId.trim()) {
    const existingId = await findUserByEmailOrId(studentId.trim());
    if (existingId) {
      res.status(409).json({
        success: false,
        error: 'An account with this Student ID already exists.',
      });
      return;
    }
  }

  // 5. Hash password with bcrypt
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 6. Create student user (clean empty profile)
  const user = await createNewUser({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    phone: phone?.trim() || undefined,
    studentId: studentId?.trim() || undefined,
    role: 'STUDENT',
  });

  // 7. Generate JWT
  const token = generateToken(user.id, user.email, user.role);

  res.status(201).json({
    success: true,
    message: 'Student account registered successfully! Welcome to Smart Canteen.',
    user,
    token,
  });
}));

/**
 * Shared login verification logic
 */
async function processLogin(
  req: Request,
  res: Response,
  targetPortal?: 'STUDENT' | 'STAFF' | 'ADMIN'
): Promise<void> {
  const { identifier, email, password, portal } = req.body;
  const loginId = (identifier || email || '').trim().toLowerCase();
  const activePortal = targetPortal || portal;

  if (!loginId || !password) {
    res.status(400).json({
      success: false,
      error: 'Please enter both your email / ID and password.',
    });
    return;
  }

  // 1. Locate user in DB
  const user = await findUserByEmailOrId(loginId);
  if (!user) {
    // Perform dummy bcrypt hash comparison to prevent timing side-channel attacks
    await bcrypt.compare(password, DUMMY_HASH);
    res.status(401).json({
      success: false,
      error: 'Invalid email/ID or password.',
    });
    return;
  }

  // 2. Check active status
  if (!user.isActive) {
    res.status(403).json({
      success: false,
      error: 'This account has been deactivated. Please contact administration.',
    });
    return;
  }

  // 3. Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    // Generic message for wrong password (same as unknown user)
    res.status(401).json({
      success: false,
      error: 'Invalid email/ID or password.',
    });
    return;
  }

  // 4. Server-Side Role & Portal Enforcement
  if (activePortal === 'STAFF') {
    if (user.role !== 'STAFF') {
      res.status(403).json({
        success: false,
        error: 'Access denied. This account does not have permission to access the Staff portal.',
      });
      return;
    }
  } else if (activePortal === 'ADMIN') {
    if (user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Access denied. This account does not have permission to access the Administration portal.',
      });
      return;
    }
  } else if (activePortal === 'STUDENT') {
    if (user.role !== 'STUDENT') {
      res.status(403).json({
        success: false,
        error: 'Access denied. This account does not have permission to access the Student portal.',
      });
      return;
    }
  }

  // 5. Generate Token and return safe user
  const token = generateToken(user.id, user.email, user.role);
  const safeUser = toSafeUser(user);

  res.status(200).json({
    success: true,
    message: `Successfully authenticated as ${user.role}.`,
    user: safeUser,
    token,
  });
}

/**
 * @route   POST /api/auth/login
 * @desc    General login endpoint with optional portal verification
 * @access  Public
 */
router.post('/login', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  return processLogin(req, res);
}));

/**
 * @route   POST /api/auth/student/login
 * @desc    Student login endpoint with server-side portal validation
 * @access  Public
 */
router.post('/student/login', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  return processLogin(req, res, 'STUDENT');
}));

/**
 * @route   POST /api/auth/staff/login
 * @desc    Staff login endpoint with server-side role validation
 * @access  Public
 */
router.post('/staff/login', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  return processLogin(req, res, 'STAFF');
}));

/**
 * @route   POST /api/auth/admin/login
 * @desc    Admin login endpoint with server-side role validation
 * @access  Public
 */
router.post('/admin/login', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  return processLogin(req, res, 'ADMIN');
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (JWT)
 */
router.get('/me', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user / invalidate session
 * @access  Public
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}));

export default router;