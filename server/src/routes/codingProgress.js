import express from 'express';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get coding progress
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const progress = await prisma.codingProgress.findMany({
      where: { userId: req.user.id },
      orderBy: { difficulty: 'asc' },
    });
    res.json(progress);
  } catch (error) {
    next(error);
  }
});

// Update solved count for a difficulty
router.patch('/:difficulty', authenticateToken, async (req, res, next) => {
  try {
    const { difficulty } = req.params;
    const { solved } = req.body;

    const record = await prisma.codingProgress.findFirst({
      where: {
        userId: req.user.id,
        difficulty: difficulty.toLowerCase(),
      },
    });

    if (!record) {
      return res.status(404).json({ error: 'Coding progress record not found' });
    }

    const updated = await prisma.codingProgress.update({
      where: { id: record.id },
      data: {
        solved: Math.min(Math.max(0, parseInt(solved)), record.total),
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
