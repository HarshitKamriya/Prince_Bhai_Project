import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.activityLog.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.focusSession.deleteMany({});
  await prisma.scheduleEntry.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.quest.deleteMany({});
  await prisma.userAttribute.deleteMany({});
  await prisma.productivityMetric.deleteMany({});
  await prisma.consistencyData.deleteMany({});
  await prisma.codingProgress.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding database...');

  // Create default user
  const passwordHash = await bcrypt.hash('prince123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'prince@levelup.os',
      username: 'prince_dev',
      displayName: 'Prince',
      passwordHash,
      level: 8,
      totalXp: 3200,
      xpToNextLevel: 4000,
      currentStreak: 15,
      role: 'ARCHITECT',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150', // placeholder premium avatar
    },
  });

  console.log(`User created: ${user.username}`);

  // Seed User Attributes
  const attributes = [
    { name: 'DISCIPLINE', level: 12, progressPercent: 85 },
    { name: 'FOCUS', level: 9, progressPercent: 70 },
    { name: 'KNOWLEDGE', level: 15, progressPercent: 92 },
    { name: 'HEALTH', level: 10, progressPercent: 78 },
    { name: 'CODING', level: 22, progressPercent: 95 },
  ];

  for (const attr of attributes) {
    await prisma.userAttribute.create({
      data: {
        userId: user.id,
        name: attr.name,
        level: attr.level,
        progressPercent: attr.progressPercent,
      },
    });
  }

  // Seed Quests
  const quests = [
    { title: 'Solve 3 Leetcode Problems', xpReward: 50, icon: 'code', category: 'coding', status: 'active', tags: ['DS', 'Algorithms'] },
    { title: 'Gym Session', xpReward: 20, icon: 'fitness_center', category: 'gym', status: 'active', tags: ['Push Day', 'Strength'] },
    { title: 'Reading', xpReward: 10, icon: 'auto_stories', category: 'reading', status: 'active', tags: ['Clean Code', 'Chapter 5'] },
  ];

  for (const q of quests) {
    await prisma.quest.create({
      data: {
        userId: user.id,
        ...q,
      },
    });
  }

  // Seed Tasks
  const tasks = [
    { title: 'Refactor API Layer', category: 'DEEP_WORK', isCompleted: false, sortOrder: 0 },
    { title: 'System Architecture Docs', category: 'DEEP_WORK', isCompleted: false, sortOrder: 1 },
    { title: 'Daily High-Intensity Interval', category: 'HEALTH', isCompleted: false, sortOrder: 0 },
    { title: 'Read: Clean Code Chap 5', category: 'PERSONAL', isCompleted: false, sortOrder: 0 },
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: {
        userId: user.id,
        ...t,
      },
    });
  }

  // Seed Daily Schedule
  const schedule = [
    { date: new Date(), startTime: '06:00', endTime: '07:00', title: 'DSA Study Session', description: 'Focus on Graph Algorithms & Dynamic Programming.', status: 'completed', category: 'coding' },
    { date: new Date(), startTime: '07:00', endTime: '08:00', title: 'Gym: Push Day', description: 'Strength training at PowerHouse Gym.', status: 'completed', category: 'gym' },
    { date: new Date(), startTime: '08:00', endTime: '17:00', title: 'College Classes', description: 'Distributed Systems & AI Ethics.', status: 'upcoming', category: 'other' },
    { date: new Date(), startTime: '18:00', endTime: '20:00', title: 'Personal Project', description: 'Working on LEVELUP OS UI components.', status: 'upcoming', category: 'coding' },
  ];

  for (const entry of schedule) {
    await prisma.scheduleEntry.create({
      data: {
        userId: user.id,
        ...entry,
      },
    });
  }

  // Seed Coding Progress
  const codingProgress = [
    { platform: 'leetcode', difficulty: 'easy', solved: 45, total: 100 },
    { platform: 'leetcode', difficulty: 'medium', solved: 12, total: 50 },
    { platform: 'leetcode', difficulty: 'hard', solved: 2, total: 20 },
  ];

  for (const progress of codingProgress) {
    await prisma.codingProgress.create({
      data: {
        userId: user.id,
        ...progress,
      },
    });
  }

  // Seed Achievements
  const achievements = [
    { name: 'First Task', description: 'Complete your first productivity task', icon: 'trophy', color: 'primary', isUnlocked: true, unlockedAt: new Date() },
    { name: '7 Day Streak', description: 'Maintain a 7 day streak of deep work', icon: 'calendar_today', color: 'secondary', isUnlocked: true, unlockedAt: new Date() },
    { name: 'Gym Warrior', description: 'Complete 10 fitness-related quests', icon: 'fitness_center', color: 'tertiary', isUnlocked: true, unlockedAt: new Date() },
    { name: 'God Mode', description: 'Complete all daily quests 5 days in a row', icon: 'bolt', color: 'error', isUnlocked: false },
    { name: 'Deep Diver', description: 'Complete a 120-minute focus session', icon: 'hourglass_empty', color: 'primary', isUnlocked: false },
    { name: 'Polymath', description: 'Level up all attributes to level 10', icon: 'school', color: 'secondary', isUnlocked: false },
  ];

  for (const ach of achievements) {
    await prisma.achievement.create({
      data: {
        userId: user.id,
        ...ach,
      },
    });
  }

  // Seed Activity Logs
  const activityLogs = [
    { timestamp: new Date(Date.now() - 4 * 3600 * 1000), description: 'COMPLETED QUEST "Refactor API Layer"', type: 'XP_GAIN', xpAmount: 450 },
    { timestamp: new Date(Date.now() - 6 * 3600 * 1000), description: 'DEEP WORK SESSION: 90 min (STREAK x2)', type: 'FOCUS', xpAmount: 100 },
    { timestamp: new Date(Date.now() - 8 * 3600 * 1000), description: 'ACHIEVEMENT UNLOCKED "Early Bird"', type: 'BADGE' },
    { timestamp: new Date(Date.now() - 10 * 3600 * 1000), description: 'SYSTEM BOOT', type: 'SYSTEM' },
  ];

  for (const log of activityLogs) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        ...log,
      },
    });
  }

  // Seed Consistency Heatmap Data (random for past 30 days)
  const now = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    await prisma.consistencyData.create({
      data: {
        userId: user.id,
        date: d,
        intensity: Math.floor(Math.random() * 5), // 0 to 4
      },
    });
  }

  // Seed Productivity Metrics for current week/month
  const metrics = [
    { date: new Date(), productiveHours: 8.5, wastedHours: 1.2, focusScore: 92, codingPercent: 40, gymPercent: 15, readingPercent: 10, otherPercent: 35 },
  ];

  for (const m of metrics) {
    await prisma.productivityMetric.create({
      data: {
        userId: user.id,
        ...m,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
