import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/db.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, username, displayName, password } = req.body;

    if (!email || !username || !displayName || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName,
        passwordHash,
        level: 1,
        totalXp: 0,
        xpToNextLevel: 1000,
        currentStreak: 0,
        role: 'INITIATE',
      },
    });

    // Seed default attributes
    const defaultAttributes = [
      { name: 'DISCIPLINE', level: 1, progressPercent: 0 },
      { name: 'FOCUS', level: 1, progressPercent: 0 },
      { name: 'KNOWLEDGE', level: 1, progressPercent: 0 },
      { name: 'HEALTH', level: 1, progressPercent: 0 },
      { name: 'CODING', level: 1, progressPercent: 0 },
    ];

    await prisma.userAttribute.createMany({
      data: defaultAttributes.map(attr => ({
        userId: user.id,
        ...attr
      }))
    });

    // Seed default achievements
    const defaultAchievements = [
      { name: 'First Task', description: 'Complete your first productivity task', icon: 'trophy', color: 'primary', isUnlocked: false },
      { name: '7 Day Streak', description: 'Maintain a 7 day streak of deep work', icon: 'calendar_today', color: 'secondary', isUnlocked: false },
      { name: 'Gym Warrior', description: 'Complete 10 fitness-related quests', icon: 'fitness_center', color: 'tertiary', isUnlocked: false },
      { name: 'God Mode', description: 'Complete all daily quests 5 days in a row', icon: 'bolt', color: 'error', isUnlocked: false },
      { name: 'Deep Diver', description: 'Complete a 120-minute focus session', icon: 'hourglass_empty', color: 'primary', isUnlocked: false },
      { name: 'Polymath', description: 'Level up all attributes to level 10', icon: 'school', color: 'secondary', isUnlocked: false },
    ];

    await prisma.achievement.createMany({
      data: defaultAchievements.map(ach => ({
        userId: user.id,
        ...ach
      }))
    });

    // Seed default coding progress
    await prisma.codingProgress.createMany({
      data: [
        { userId: user.id, platform: 'leetcode', difficulty: 'easy', solved: 0, total: 100 },
        { userId: user.id, platform: 'leetcode', difficulty: 'medium', solved: 0, total: 50 },
        { userId: user.id, platform: 'leetcode', difficulty: 'hard', solved: 0, total: 20 },
      ]
    });

    // System Boot Activity Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        description: 'SYSTEM BOOT: LevelUp OS initialized',
        type: 'SYSTEM',
      }
    });

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'levelup_os_secret_key_1337',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        level: user.level,
        totalXp: user.totalXp,
        xpToNextLevel: user.xpToNextLevel,
        currentStreak: user.currentStreak,
        role: user.role,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: usernameOrEmail },
          { username: usernameOrEmail }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last active date & potentially streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let updatedStreak = user.currentStreak;
    if (user.lastActiveDate) {
      const lastActive = new Date(user.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(today - lastActive);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Daily login increments streak (simulate logic or keep manual)
      } else if (diffDays > 1) {
        // streak broken unless maintained by consistency data
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveDate: new Date(),
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'levelup_os_secret_key_1337',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        level: user.level,
        totalXp: user.totalXp,
        xpToNextLevel: user.xpToNextLevel,
        currentStreak: user.currentStreak,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Google Login / Auto-Registration
router.post('/google-login', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Google authentication token is required' });
    }

    let email, name, picture;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    // Check if bypass mode applies
    if (!clientId && process.env.NODE_ENV === 'development' && token === 'mock-google-token') {
      email = 'prince_google_dev@example.com';
      name = 'Prince Google Dev';
      picture = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150';
      console.warn('[LEVELUP OS WARNING] Google Client ID not configured. Bypassing token validation via mock credentials.');
    } else {
      if (!clientId) {
        return res.status(500).json({ error: 'Google Client ID is not configured on this server.' });
      }

      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
      } catch (err) {
        console.error('Google token verification error:', err);
        return res.status(400).json({ error: 'Invalid Google token' });
      }
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Auto-register new Google user
      let username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
      
      // Ensure unique username
      const existingUser = await prisma.user.findFirst({
        where: { username },
      });
      if (existingUser) {
        username = `${username}_${Math.floor(Math.random() * 1000)}`;
      }

      // Generate a long random password for Google signups
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          username,
          displayName: name || username,
          avatarUrl: picture || null,
          passwordHash,
          level: 1,
          totalXp: 0,
          xpToNextLevel: 1000,
          currentStreak: 0,
          role: 'INITIATE',
        },
      });

      // Seed default attributes
      const defaultAttributes = [
        { name: 'DISCIPLINE', level: 1, progressPercent: 0 },
        { name: 'FOCUS', level: 1, progressPercent: 0 },
        { name: 'KNOWLEDGE', level: 1, progressPercent: 0 },
        { name: 'HEALTH', level: 1, progressPercent: 0 },
        { name: 'CODING', level: 1, progressPercent: 0 },
      ];

      await prisma.userAttribute.createMany({
        data: defaultAttributes.map(attr => ({
          userId: user.id,
          ...attr
        }))
      });

      // Seed default achievements
      const defaultAchievements = [
        { name: 'First Task', description: 'Complete your first productivity task', icon: 'trophy', color: 'primary', isUnlocked: false },
        { name: '7 Day Streak', description: 'Maintain a 7 day streak of deep work', icon: 'calendar_today', color: 'secondary', isUnlocked: false },
        { name: 'Gym Warrior', description: 'Complete 10 fitness-related quests', icon: 'fitness_center', color: 'tertiary', isUnlocked: false },
        { name: 'God Mode', description: 'Complete all daily quests 5 days in a row', icon: 'bolt', color: 'error', isUnlocked: false },
        { name: 'Deep Diver', description: 'Complete a 120-minute focus session', icon: 'hourglass_empty', color: 'primary', isUnlocked: false },
        { name: 'Polymath', description: 'Level up all attributes to level 10', icon: 'school', color: 'secondary', isUnlocked: false },
      ];

      await prisma.achievement.createMany({
        data: defaultAchievements.map(ach => ({
          userId: user.id,
          ...ach
        }))
      });

      // Seed default coding progress
      await prisma.codingProgress.createMany({
        data: [
          { userId: user.id, platform: 'leetcode', difficulty: 'easy', solved: 0, total: 100 },
          { userId: user.id, platform: 'leetcode', difficulty: 'medium', solved: 0, total: 50 },
          { userId: user.id, platform: 'leetcode', difficulty: 'hard', solved: 0, total: 20 },
        ]
      });

      // System Boot Activity Log
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          description: 'SYSTEM BOOT: LevelUp OS initialized via Google Sign-In',
          type: 'SYSTEM',
        }
      });
    } else {
      // If user profile has no avatar, update with Google picture if available
      if (!user.avatarUrl && picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: picture },
        });
      }

      // Update last active date
      user = await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveDate: new Date() },
      });
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'levelup_os_secret_key_1337',
      { expiresIn: '30d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        level: user.level,
        totalXp: user.totalXp,
        xpToNextLevel: user.xpToNextLevel,
        currentStreak: user.currentStreak,
        role: user.role,
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;
