import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get current user profile details
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        attributes: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash, ...userData } = user;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});

// Update profile details
router.patch('/me', authenticateToken, async (req, res, next) => {
  try {
    const { displayName, avatarUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        displayName,
        avatarUrl,
      },
      include: {
        attributes: true,
      },
    });

    const { passwordHash, ...userData } = updatedUser;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});

// Get user diagnostics stats for settings
router.get('/me/stats', authenticateToken, async (req, res, next) => {
  try {
    const questsCompleted = await prisma.quest.count({
      where: { userId: req.user.id, status: 'completed' }
    });
    const focusSessions = await prisma.focusSession.count({
      where: { userId: req.user.id }
    });
    const journalEntries = await prisma.journalEntry.count({
      where: { userId: req.user.id }
    });

    res.json({
      questsCompleted,
      focusSessions,
      journalEntries
    });
  } catch (error) {
    next(error);
  }
});

// Update password
router.patch('/me/password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Export all user data as JSON
router.get('/me/export', authenticateToken, async (req, res, next) => {
  try {
    const data = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        attributes: true,
        quests: true,
        tasks: true,
        schedule: true,
        focusSessions: true,
        journalEntries: true,
        achievements: true,
        activityLogs: true,
        metrics: true,
        consistency: true,
        codingProgress: true,
        habits: true
      }
    });

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash, ...safeData } = data;
    res.json(safeData);
  } catch (error) {
    next(error);
  }
});

// Reset user progress (XP, level, streaks, attributes)
router.post('/me/reset', authenticateToken, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        level: 1,
        totalXp: 0,
        xpToNextLevel: 1000,
        currentStreak: 0,
      }
    });

    await prisma.userAttribute.updateMany({
      where: { userId: req.user.id },
      data: {
        level: 1,
        progressPercent: 0
      }
    });

    res.json({ message: 'User progress reset successfully' });
  } catch (error) {
    next(error);
  }
});

// Permanently delete user account
router.delete('/me', authenticateToken, async (req, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.id }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
