import express from 'express';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get consistency heatmap data
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const consistency = await prisma.consistencyData.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: oneYearAgo,
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json(consistency);
  } catch (error) {
    next(error);
  }
});

// Update or log today's activity manually (optional helper)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { intensity } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.consistencyData.findUnique({
      where: {
        userId_date: {
          userId: req.user.id,
          date: today,
        },
      },
    });

    let record;
    if (existing) {
      record = await prisma.consistencyData.update({
        where: { id: existing.id },
        data: {
          intensity: intensity !== undefined ? parseInt(intensity) : Math.min(existing.intensity + 1, 4),
        },
      });
    } else {
      record = await prisma.consistencyData.create({
        data: {
          userId: req.user.id,
          date: today,
          intensity: intensity !== undefined ? parseInt(intensity) : 1,
        },
      });
    }

    res.json(record);
  } catch (error) {
    next(error);
  }
});

export default router;
