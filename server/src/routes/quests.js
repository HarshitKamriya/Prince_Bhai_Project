import express from 'express';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { awardXp } from '../services/xpService.js';

const router = express.Router();

// Get all quests
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status } = req.query;

    const quests = await prisma.quest.findMany({
      where: {
        userId: req.user.id,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(quests);
  } catch (error) {
    next(error);
  }
});

// Create quest
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { title, description, xpReward, icon, category, tags, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const quest = await prisma.quest.create({
      data: {
        userId: req.user.id,
        title,
        description,
        xpReward: xpReward ? parseInt(xpReward) : 10,
        icon: icon || 'military_tech',
        category: category || 'other',
        tags: tags || [],
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.status(201).json(quest);
  } catch (error) {
    next(error);
  }
});

// Complete Quest
router.post('/:id/complete', authenticateToken, async (req, res, next) => {
  try {
    const questId = parseInt(req.params.id);

    const quest = await prisma.quest.findFirst({
      where: { id: questId, userId: req.user.id },
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    if (quest.status === 'completed') {
      return res.status(400).json({ error: 'Quest already completed' });
    }

    // Mark quest completed
    const updatedQuest = await prisma.quest.update({
      where: { id: questId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Determine attribute to level up based on category
    let attributeName = '';
    if (quest.category === 'coding') {
      attributeName = 'CODING';
    } else if (quest.category === 'gym') {
      attributeName = 'HEALTH';
    } else if (quest.category === 'reading') {
      attributeName = 'KNOWLEDGE';
    }

    if (attributeName) {
      const attr = await prisma.userAttribute.findFirst({
        where: { userId: req.user.id, name: attributeName },
      });

      if (attr) {
        let newProgress = attr.progressPercent + 20; // 20% gain
        let newLvl = attr.level;
        if (newProgress >= 100) {
          newProgress -= 100;
          newLvl += 1;
        }

        await prisma.userAttribute.update({
          where: { id: attr.id },
          data: {
            level: newLvl,
            progressPercent: newProgress,
          },
        });
      }
    }

    // Award XP
    const xpResult = await awardXp(
      req.user.id,
      quest.xpReward,
      `COMPLETED QUEST "${quest.title}"`
    );

    // Check custom achievement unlocks: e.g. "Gym Warrior"
    if (quest.category === 'gym') {
      const completedGymQuestsCount = await prisma.quest.count({
        where: { userId: req.user.id, category: 'gym', status: 'completed' },
      });
      if (completedGymQuestsCount >= 10) {
        // Unlock Gym Warrior
        const gwAch = await prisma.achievement.findFirst({
          where: { userId: req.user.id, name: 'Gym Warrior' },
        });
        if (gwAch && !gwAch.isUnlocked) {
          await prisma.achievement.update({
            where: { id: gwAch.id },
            data: { isUnlocked: true, unlockedAt: new Date() },
          });
          await prisma.activityLog.create({
            data: {
              userId: req.user.id,
              description: 'ACHIEVEMENT UNLOCKED: "Gym Warrior" 🏆',
              type: 'BADGE',
            },
          });
        }
      }
    }

    res.json({
      quest: updatedQuest,
      xpGained: quest.xpReward,
      currentXp: xpResult.user.totalXp,
      level: xpResult.user.level,
      leveledUp: xpResult.leveledUp,
    });
  } catch (error) {
    next(error);
  }
});

// Update Quest details
router.patch('/:id', authenticateToken, async (req, res, next) => {
  try {
    const questId = parseInt(req.params.id);
    const { title, description, xpReward, icon, category, tags, dueDate, status } = req.body;

    const quest = await prisma.quest.findFirst({
      where: { id: questId, userId: req.user.id },
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    const updatedQuest = await prisma.quest.update({
      where: { id: questId },
      data: {
        title,
        description,
        xpReward: xpReward ? parseInt(xpReward) : undefined,
        icon,
        category,
        tags,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
      },
    });

    res.json(updatedQuest);
  } catch (error) {
    next(error);
  }
});

// Delete Quest
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const questId = parseInt(req.params.id);

    const quest = await prisma.quest.findFirst({
      where: { id: questId, userId: req.user.id },
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    await prisma.quest.delete({
      where: { id: questId },
    });

    res.json({ message: 'Quest deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
