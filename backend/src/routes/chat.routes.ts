import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { answerChat } from '../services/chatService';
import { generateGeminiContent } from '../services/aiService';
import { env } from '../config/env';

const router = Router();

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(300),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string().max(300),
  })).max(6).optional(),
});

const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as AuthenticatedRequest).user?.id || req.ip || 'unknown',
  message: { success: false, error: 'Too many chat requests. Please try again in a few minutes.' },
});

router.post(
  '/',
  authenticateToken,
  requireRole('STUDENT'),
  chatLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { message, history = [] } = chatRequestSchema.parse(req.body);
    const menuItems = await prisma.menuItem.findMany({
      include: { category: { select: { name: true, isAvailable: true } } },
      orderBy: { name: 'asc' },
    });
    const result = await answerChat(
      message,
      history,
      menuItems,
      new Date(),
      generateGeminiContent,
      env.NODE_ENV !== 'test' && env.AI_PROVIDER === 'gemini',
    );
    console.info(`[Chat] intent=${result.intent} outcome=${result.outcome}`);

    res.status(200).json({
      success: true,
      data: {
        reply: result.reply,
        items: result.items,
      },
    });
  })
);

export default router;
