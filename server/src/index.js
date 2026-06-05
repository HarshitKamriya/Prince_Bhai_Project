import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import questRoutes from './routes/quests.js';
import taskRoutes from './routes/tasks.js';
import scheduleRoutes from './routes/schedule.js';
import attributeRoutes from './routes/attributes.js';
import focusRoutes from './routes/focus.js';
import journalRoutes from './routes/journal.js';
import achievementRoutes from './routes/achievements.js';
import analyticsRoutes from './routes/analytics.js';
import logRoutes from './routes/activityLog.js';
import consistencyRoutes from './routes/consistency.js';
import codingProgressRoutes from './routes/codingProgress.js';
import habitRoutes from './routes/habits.js';
import aiRoutes from './routes/ai.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup
app.use(cors({
  origin: '*', // Allow all origins for dev/testing ease
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', time: new Date() });
});

// Routing
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activity-log', logRoutes);
app.use('/api/consistency', consistencyRoutes);
app.use('/api/coding-progress', codingProgressRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/ai', aiRoutes);

// Error Handler Middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`[LEVELUP OS SERVER] running on http://localhost:${PORT}`);
});
