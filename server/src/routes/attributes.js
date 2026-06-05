import express from 'express';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all attributes
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const attributes = await prisma.userAttribute.findMany({
      where: { userId: req.user.id },
    });

    res.json(attributes);
  } catch (error) {
    next(error);
  }
});

// Update specific attribute progress/level
router.patch('/:name', authenticateToken, async (req, res, next) => {
  try {
    const { name } = req.params;
    const { level, progressPercent } = req.body;

    const attribute = await prisma.userAttribute.findFirst({
      where: { userId: req.user.id, name: name.toUpperCase() },
    });

    if (!attribute) {
      return res.status(404).json({ error: 'Attribute not found' });
    }

    const updated = await prisma.userAttribute.update({
      where: { id: attribute.id },
      data: {
        level: level !== undefined ? parseInt(level) : undefined,
        progressPercent: progressPercent !== undefined ? parseInt(progressPercent) : undefined,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
