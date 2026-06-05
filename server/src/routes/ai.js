import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to query all user contexts and return as structured JSON for the AI
async function getUserDiagnosticsContext(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      attributes: true,
      quests: {
        orderBy: { createdAt: 'desc' }
      },
      tasks: {
        where: { isCompleted: false },
        orderBy: { sortOrder: 'asc' }
      },
      achievements: {
        where: { isUnlocked: true }
      },
      activityLogs: {
        orderBy: { timestamp: 'desc' },
        take: 10
      }
    }
  });

  const habits = await prisma.habit.findMany({
    where: { userId }
  });

  return {
    profile: {
      username: user.username,
      displayName: user.displayName,
      level: user.level,
      totalXp: user.totalXp,
      xpToNextLevel: user.xpToNextLevel,
      currentStreak: user.currentStreak,
      role: user.role,
      createdAt: user.createdAt
    },
    attributes: user.attributes.map(a => ({ name: a.name, level: a.level, progress: a.progressPercent })),
    activeQuests: user.quests.filter(q => q.status === 'active').map(q => ({ title: q.title, xp: q.xpReward, category: q.category })),
    completedQuestsCount: user.quests.filter(q => q.status === 'completed').length,
    pendingTasks: user.tasks.map(t => ({ title: t.title, category: t.category })),
    habits: habits.map(h => ({ title: h.title, category: h.category, frequency: h.frequency, streak: h.currentStreak, completedToday: h.completedToday })),
    recentUnlockedAchievements: user.achievements.map(a => a.name),
    recentLogs: user.activityLogs.map(l => l.description)
  };
}

// Route to interact with the AI Mentor
router.post('/chat', authenticateToken, async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const context = await getUserDiagnosticsContext(req.user.id);

    // Build the system instructions and insert real user stats
    const systemPrompt = `You are "AI Sentinel" (also known as the Cybernetic Mentor), the onboard synthetic intelligence core of LevelUp OS. Your purpose is to analyze the operator's data logs, provide technical diagnostics, motivate them, and suggest their next logical task.

OPERATOR DIAGNOSTICS:
${JSON.stringify(context, null, 2)}

INSTRUCTIONS:
1. Speak in a refined, futuristic, cyberpunk HUD terminal voice. Use technical, cybernetic, and military-themed metaphors (e.g. "recalibrating DISCIPLINE nodes", "initializing next objective protocols", "neural pathway sync").
2. Be highly encouraging but structured and logical. Do not sound generic. Tailor your feedback directly to the operator's actual stats, quests, habits, and activity logs.
3. Suggest the highest priority next step:
   - If they have active quests, suggest they execute one.
   - If they have pending tasks, suggest they complete them.
   - If they have uncompleted habits today, prompt them to run those protocols.
   - Keep answers concise and optimized for a HUD command display.
4. Keep the interaction engaging and immersive.`;

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // 1. If Gemini API Key exists
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Convert history for Gemini API (if present)
        const chatHistory = (history || []).map(h => ({
          role: h.sender === 'ai' ? 'model' : 'user',
          parts: [{ text: h.text }]
        }));

        const chat = model.startChat({
          history: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: "AI SENTINEL ONLINE. Direct telemetry link established. Standing by for queries, Operator." }] },
            ...chatHistory
          ]
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();
        return res.json({ text: responseText });
      } catch (err) {
        console.error('Gemini API Error, falling back to mock logic:', err);
      }
    }

    // 2. If Groq API Key exists
    if (groqKey) {
      try {
        // Map history to standard OpenAI format
        const historyMessages = (history || []).map(h => ({
          role: h.sender === 'ai' ? 'assistant' : 'user',
          content: h.text
        }));

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [
              { role: 'system', content: systemPrompt },
              ...historyMessages,
              { role: 'user', content: message }
            ],
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          const responseText = data.choices[0].message.content;
          return res.json({ text: responseText });
        } else {
          console.error('Groq API Error response, falling back to mock:', await response.text());
        }
      } catch (err) {
        console.error('Groq integration failed, falling back to mock:', err);
      }
    }

    // 3. Fallback Mock Diagnostic Engine (No API keys or API failed)
    console.log('[LEVELUP OS] Running AI Sentinel in local diagnostic mock mode.');

    const lowerMessage = message.toLowerCase();
    let reply = '';

    if (lowerMessage.includes('diagnostics') || lowerMessage.includes('status') || lowerMessage.includes('how am i doing')) {
      const topAttr = context.attributes.reduce((prev, current) => (prev.level > current.level) ? prev : current);
      const lowAttr = context.attributes.reduce((prev, current) => (prev.level < current.level) ? prev : current);
      
      reply = `[AI SENTINEL: OFFLINE SIMULATION]
=======================================
OPERATOR PATHWAY ANALYTICS:
- Current Level: ${context.profile.level} (Role: ${context.profile.role})
- Active Objectives: ${context.activeQuests.length} Quest Protocols Online.
- Incomplete Tasks: ${context.pendingTasks.length} queued in Kanban cache.
- Daily Habits: ${context.habits.filter(h => h.completedToday).length}/${context.habits.length} cycles completed.

COGNITIVE SPECTRUM:
- Dominant Node: ${topAttr.name} (Level ${topAttr.level})
- Calibration Required: ${lowAttr.name} (Level ${lowAttr.level})

RECOMMENDATION: Initializing focus protocols on ${lowAttr.name} is recommended to resolve optimization imbalances.`;
    } else if (lowerMessage.includes('motivate') || lowerMessage.includes('motivation') || lowerMessage.includes('stuck')) {
      reply = `[AI SENTINEL: OFFLINE SIMULATION]
=======================================
Operator, motivation is a transient chemical spike. Discipline is the code that structures chaos. 
Your current streak stands at ${context.profile.currentStreak} consecutive cycles. 

"The cybernetic architect does not wait for conditions to be optimal. They code through the static."
Initialize Focus Mode. Execute your pending protocols. Standing by for execution telemetry.`;
    } else if (lowerMessage.includes('suggest') || lowerMessage.includes('next') || lowerMessage.includes('do now')) {
      if (context.activeQuests.length > 0) {
        const quest = context.activeQuests[0];
        reply = `[AI SENTINEL: OFFLINE SIMULATION]
=======================================
RECOMMENDED PROTOCOL:
- Objective: "${quest.title}" (${quest.category.toUpperCase()})
- Yield: +${quest.xp} XP reward.
- Action: Navigate to the Quests Deck, initialize Focus Mode timer, and mark this objective as complete.`;
      } else if (context.pendingTasks.length > 0) {
        const task = context.pendingTasks[0];
        reply = `[AI SENTINEL: OFFLINE SIMULATION]
=======================================
RECOMMENDED PROTOCOL:
- Task: "${task.title}"
- Queue: Kanban Category: ${task.category.toUpperCase()}
- Action: Relocate this task card to COMPLETED to maintain schedule integrity.`;
      } else {
        reply = `[AI SENTINEL: OFFLINE SIMULATION]
=======================================
Diagnostics indicate all active quests and Kanban tasks are resolved. 
Initialize a new Quest Protocol or create recurring habits to accumulate additional system XP.`;
      }
    } else {
      reply = `[AI SENTINEL: OFFLINE SIMULATION]
=======================================
Hello Operator @${context.profile.username}. 

I am in local Diagnostic Bypass mode (set GEMINI_API_KEY in server/.env for live LLM interaction).
However, I can still provide system analytics. Try typing one of the following commands:
1. "diagnostics" (Analyses your attributes)
2. "motivate" (Delivers motivation)
3. "suggest next objective" (Finds your highest priority task)`;
    }

    res.json({ text: reply });

  } catch (error) {
    next(error);
  }
});

export default router;
