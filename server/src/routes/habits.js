import express from 'express';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { awardXp } from '../services/xpService.js';

const router = express.Router();

// Get all habits for the authenticated user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(habits);
  } catch (error) {
    next(error);
  }
});

// Create a new habit
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { title, icon, category, frequency, targetCount } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const habit = await prisma.habit.create({
      data: {
        userId: req.user.id,
        title,
        icon: icon || 'repeat',
        category: category || 'health',
        frequency: frequency || 'daily',
        targetCount: targetCount ? parseInt(targetCount) : 1,
      },
    });

    res.status(201).json(habit);
  } catch (error) {
    next(error);
  }
});

// Toggle today's completion
router.patch('/:id/toggle', authenticateToken, async (req, res, next) => {
  try {
    const habitId = parseInt(req.params.id);

    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: req.user.id },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    let updateData = {};
    let xpResult = null;

    if (!habit.completedToday) {
      // Mark as completed
      const newStreak = habit.currentStreak + 1;
      const newBest = Math.max(newStreak, habit.bestStreak);

      updateData = {
        completedToday: true,
        currentStreak: newStreak,
        bestStreak: newBest,
        lastCompletedAt: new Date(),
      };

      // Award XP for completing a habit
      xpResult = await awardXp(
        req.user.id,
        15,
        `COMPLETED HABIT "${habit.title}"`
      );
    } else {
      // Undo completion
      updateData = {
        completedToday: false,
        currentStreak: Math.max(0, habit.currentStreak - 1),
      };
    }

    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: updateData,
    });

    res.json({
      habit: updatedHabit,
      xpGained: xpResult ? 15 : 0,
      ...(xpResult ? {
        currentXp: xpResult.user.totalXp,
        level: xpResult.user.level,
        leveledUp: xpResult.leveledUp,
      } : {}),
    });
  } catch (error) {
    next(error);
  }
});

// Update a habit
router.patch('/:id', authenticateToken, async (req, res, next) => {
  try {
    const habitId = parseInt(req.params.id);
    const { title, icon, category, frequency, targetCount, isActive } = req.body;

    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: req.user.id },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        title,
        icon,
        category,
        frequency,
        targetCount: targetCount ? parseInt(targetCount) : undefined,
        isActive,
      },
    });

    res.json(updatedHabit);
  } catch (error) {
    next(error);
  }
});

// Delete a habit
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const habitId = parseInt(req.params.id);

    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: req.user.id },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    await prisma.habit.delete({
      where: { id: habitId },
    });

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Reset all habits' completedToday to false (daily reset)
router.post('/reset-daily', authenticateToken, async (req, res, next) => {
  try {
    await prisma.habit.updateMany({
      where: { userId: req.user.id },
      data: { completedToday: false },
    });

    res.json({ message: 'Daily habits reset successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
