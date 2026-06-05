import express from 'express';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { awardXp, unlockAchievement } from '../services/xpService.js';

const router = express.Router();

// Get all tasks
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: { sortOrder: 'asc' },
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Create task
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { title, category } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and Category are required' });
    }

    // Get max sort order
    const maxOrder = await prisma.task.aggregate({
      where: { userId: req.user.id, category },
      _max: { sortOrder: true },
    });

    const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const task = await prisma.task.create({
      data: {
        userId: req.user.id,
        title,
        category,
        sortOrder: nextOrder,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// Complete/Toggle Task
router.post('/:id/complete', authenticateToken, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: req.user.id },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const isCompleted = !task.isCompleted;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { isCompleted },
    });

    let xpResult = null;
    if (isCompleted) {
      // Award 10 XP
      xpResult = await awardXp(
        req.user.id,
        10,
        `COMPLETED TASK "${task.title}"`
      );

      // Check "First Task" achievement unlock
      await unlockAchievement(req.user.id, 'First Task');

      // Update DISCIPLINE attribute
      const disc = await prisma.userAttribute.findFirst({
        where: { userId: req.user.id, name: 'DISCIPLINE' },
      });
      if (disc) {
        let newProgress = disc.progressPercent + 5; // 5% per task
        let newLvl = disc.level;
        if (newProgress >= 100) {
          newProgress -= 100;
          newLvl += 1;
        }
        await prisma.userAttribute.update({
          where: { id: disc.id },
          data: { level: newLvl, progressPercent: newProgress },
        });
      }
    }

    res.json({
      task: updatedTask,
      xpGained: isCompleted ? 10 : 0,
      xpResult,
    });
  } catch (error) {
    next(error);
  }
});

// Reorder Tasks (Batch updates)
router.patch('/reorder', authenticateToken, async (req, res, next) => {
  try {
    const { items } = req.body; // Expects array of { id, sortOrder, category }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const updatePromises = items.map(item =>
      prisma.task.update({
        where: { id: parseInt(item.id), userId: req.user.id },
        data: {
          sortOrder: item.sortOrder,
          category: item.category,
        },
      })
    );

    await prisma.$transaction(updatePromises);

    res.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: req.user.id },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
