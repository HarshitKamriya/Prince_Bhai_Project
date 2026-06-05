import express from 'express';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all journal entries
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(entries);
  } catch (error) {
    next(error);
  }
});

// Create journal entry
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { wentWell, learned } = req.body;

    if (!wentWell || !learned) {
      return res.status(400).json({ error: 'Journal fields cannot be empty' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if entry already exists for today
    const existing = await prisma.journalEntry.findFirst({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: today,
        },
      },
    });

    if (existing) {
      // Update today's entry
      const updated = await prisma.journalEntry.update({
        where: { id: existing.id },
        data: { wentWell, learned },
      });
      return res.json(updated);
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId: req.user.id,
        wentWell,
        learned,
      },
    });

    // Award minor XP for journaling
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        description: 'SAVED SYNAPTIC RECORD (Journal Entry Saved)',
        type: 'SYSTEM',
      },
    });

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

// Delete journal entry
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const entryId = parseInt(req.params.id);

    const entry = await prisma.journalEntry.findFirst({
      where: { id: entryId, userId: req.user.id },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    await prisma.journalEntry.delete({
      where: { id: entryId },
    });

    res.json({ message: 'Journal entry deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
