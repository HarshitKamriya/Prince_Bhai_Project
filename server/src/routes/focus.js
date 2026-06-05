import express from 'express';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { awardXp, unlockAchievement } from '../services/xpService.js';

const router = express.Router();

// Start a focus session
router.post('/start', authenticateToken, async (req, res, next) => {
  try {
    const { questId, duration, breakDuration } = req.body;

    const session = await prisma.focusSession.create({
      data: {
        userId: req.user.id,
        questId: questId ? parseInt(questId) : null,
        duration: parseInt(duration) || 25,
        breakDuration: parseInt(breakDuration) || 5,
        startTime: new Date(),
        isCompleted: false,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// Complete focus session
router.post('/:id/complete', authenticateToken, async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.id);

    const session = await prisma.focusSession.findFirst({
      where: { id: sessionId, userId: req.user.id },
    });

    if (!session) {
      return res.status(404).json({ error: 'Focus session not found' });
    }

    if (session.isCompleted) {
      return res.status(400).json({ error: 'Focus session already completed' });
    }

    const updatedSession = await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        isCompleted: true,
        endTime: new Date(),
      },
    });

    // Base XP is proportional to duration: e.g. 1 XP per minute, max 100
    const xpReward = Math.min(session.duration, 120);

    // Award XP
    const xpResult = await awardXp(
      req.user.id,
      xpReward,
      `COMPLETED FOCUS SESSION (${session.duration} min)`
    );

    // Update FOCUS attribute progress
    const focusAttr = await prisma.userAttribute.findFirst({
      where: { userId: req.user.id, name: 'FOCUS' },
    });

    if (focusAttr) {
      // Award progress: e.g., duration / 2 % progress
      let progressAdded = Math.max(Math.floor(session.duration / 2), 5);
      let newProgress = focusAttr.progressPercent + progressAdded;
      let newLvl = focusAttr.level;
      if (newProgress >= 100) {
        newProgress -= 100;
        newLvl += 1;
      }
      await prisma.userAttribute.update({
        where: { id: focusAttr.id },
        data: { level: newLvl, progressPercent: newProgress },
      });
    }

    // Check achievement unlock: "Deep Diver" (for session >= 120 min)
    if (session.duration >= 120) {
      await unlockAchievement(req.user.id, 'Deep Diver');
    }

    res.json({
      session: updatedSession,
      xpGained: xpReward,
      xpResult,
    });
  } catch (error) {
    next(error);
  }
});

// Get focus history
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const history = await prisma.focusSession.findMany({
      where: { userId: req.user.id },
      orderBy: { startTime: 'desc' },
      take: 20,
    });

    res.json(history);
  } catch (error) {
    next(error);
  }
});

export default router;
