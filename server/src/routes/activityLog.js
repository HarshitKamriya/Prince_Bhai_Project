import express from 'express';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get recent activity logs
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: req.user.id },
      orderBy: { timestamp: 'desc' },
      take: 15,
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

export default router;
