import express from 'express';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get schedule for a date
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { date } = req.query;
    
    // Default to today
    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    const schedule = await prisma.scheduleEntry.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    res.json(schedule);
  } catch (error) {
    next(error);
  }
});

// Create schedule entry
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { startTime, endTime, title, description, category, date } = req.body;

    if (!startTime || !endTime || !title) {
      return res.status(400).json({ error: 'Start time, End time, and Title are required' });
    }

    const entry = await prisma.scheduleEntry.create({
      data: {
        userId: req.user.id,
        date: date ? new Date(date) : new Date(),
        startTime,
        endTime,
        title,
        description,
        category,
        status: 'upcoming',
      },
    });

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

// Update schedule entry
router.patch('/:id', authenticateToken, async (req, res, next) => {
  try {
    const entryId = parseInt(req.params.id);
    const { startTime, endTime, title, description, category, status, date } = req.body;

    const entry = await prisma.scheduleEntry.findFirst({
      where: { id: entryId, userId: req.user.id },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Schedule entry not found' });
    }

    const updatedEntry = await prisma.scheduleEntry.update({
      where: { id: entryId },
      data: {
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        title,
        description,
        category,
        status,
      },
    });

    res.json(updatedEntry);
  } catch (error) {
    next(error);
  }
});

// Delete schedule entry
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const entryId = parseInt(req.params.id);

    const entry = await prisma.scheduleEntry.findFirst({
      where: { id: entryId, userId: req.user.id },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Schedule entry not found' });
    }

    await prisma.scheduleEntry.delete({
      where: { id: entryId },
    });

    res.json({ message: 'Schedule entry deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
