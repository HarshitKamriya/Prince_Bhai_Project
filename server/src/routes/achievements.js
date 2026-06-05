import express from 'express';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all achievements
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const achievements = await prisma.achievement.findMany({
      where: { userId: req.user.id },
      orderBy: { id: 'asc' },
    });

    res.json(achievements);
  } catch (error) {
    next(error);
  }
});

export default router;
