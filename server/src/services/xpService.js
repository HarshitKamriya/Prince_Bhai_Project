import prisma from '../config/db.js';

export const awardXp = async (userId, xpAmount, sourceDescription) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error('User not found');

  let newXp = user.totalXp + xpAmount;
  let newLevel = user.level;
  let xpToNextLevel = user.xpToNextLevel;
  let leveledUp = false;

  while (newXp >= xpToNextLevel) {
    newXp -= xpToNextLevel;
    newLevel += 1;
    xpToNextLevel = newLevel * 500 + 500; // scaling XP requirements
    leveledUp = true;
  }

  // Update user stats
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      level: newLevel,
      totalXp: newXp,
      xpToNextLevel: xpToNextLevel,
    },
  });

  // Create XP Gain activity log
  await prisma.activityLog.create({
    data: {
      userId,
      description: `${sourceDescription} (+${xpAmount} XP)`,
      type: 'XP_GAIN',
      xpAmount,
    },
  });

  if (leveledUp) {
    // Create Level Up activity log
    await prisma.activityLog.create({
      data: {
        userId,
        description: `LEVEL UP! Reached Level ${newLevel} 🎉`,
        type: 'SYSTEM',
      },
    });

    // Check achievement unlock: Level milestones
    if (newLevel >= 10) {
      await unlockAchievement(userId, 'Polymath');
    }
  }

  // Update consistency for today
  await recordConsistencyActivity(userId);

  return {
    user: updatedUser,
    leveledUp,
    newLevel,
  };
};

export const recordConsistencyActivity = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.consistencyData.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (existing) {
    if (existing.intensity < 4) {
      await prisma.consistencyData.update({
        where: { id: existing.id },
        data: { intensity: existing.intensity + 1 },
      });
    }
  } else {
    await prisma.consistencyData.create({
      data: {
        userId,
        date: today,
        intensity: 1,
      },
    });
  }
};

export const unlockAchievement = async (userId, achievementName) => {
  const ach = await prisma.achievement.findFirst({
    where: { userId, name: achievementName },
  });

  if (ach && !ach.isUnlocked) {
    await prisma.achievement.update({
      where: { id: ach.id },
      data: {
        isUnlocked: true,
        unlockedAt: new Date(),
      },
    });

    // Log the unlock
    await prisma.activityLog.create({
      data: {
        userId,
        description: `ACHIEVEMENT UNLOCKED: "${achievementName}" 🏆`,
        type: 'BADGE',
      },
    });
  }
};
