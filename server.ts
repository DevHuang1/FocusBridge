import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { config } from 'dotenv';

config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.VITE_FEATHERLESS_API_KEY,
  baseURL: 'https://api.featherless.ai/v1',
});

const MODEL = process.env.FEATHERLESS_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct';

app.get('/', (_req, res) => {
  res.json({ status: 'Focus Bridge AI server running', endpoints: ['/api/ai/breakdown', '/api/ai/stuck', '/api/ai/checkin', '/api/ai/reflection'] });
});

// ── Goal Breakdown ──────────────────────────────────────────────
app.post('/api/ai/breakdown', async (req, res) => {
  const { goal, userProfile } = req.body;

  const systemPrompt = `You are Focus Bridge, a calm and supportive AI assistant for people who struggle with procrastination.

Break down the user's goal into 2-4 groups. Each group has a label, an emoji, and 2-3 tiny steps.

Example response format:
{"encouragement":"You've got this!","groups":[{"label":"Getting set up","emoji":"🌱","steps":[{"title":"Open your laptop","durationMinutes":1},{"title":"Find the file","durationMinutes":2}]}]}

Rules:
- Groups: warm labels + emoji (🌱 📖 ✍️ 🧹 💡 🎯 🔧 🎨)
- Steps: physical actions only (open, read, write, find, type, click) — never "plan" or "think"
- Each step: 1-5 minutes max
- Start each group with the tiniest possible first action
- Be warm and encouraging, never clinical
- The user has done ${userProfile.totalSessions} sessions, prefers ~${userProfile.preferredTaskDuration} min tasks

Respond with ONLY valid JSON. No markdown, no explanation, no code fences.`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: goal },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      let groups = (parsed.groups || []).map((g: { label: string; emoji: string; steps: { title: string; durationMinutes: number }[] }) => ({
        label: g.label || 'Next steps',
        emoji: g.emoji || '🌱',
        steps: (g.steps || []).map((s: { title: string; durationMinutes: number }, i: number) => ({
          id: `step-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          title: s.title,
          durationMinutes: Math.max(1, Math.min(10, s.durationMinutes || 3)),
          status: 'pending',
        })),
      }));

      if (groups.length === 0 && Array.isArray(parsed.steps)) {
        groups = [{
          label: 'Getting started',
          emoji: '🌱',
          steps: parsed.steps.map((s: { title: string; durationMinutes: number }, i: number) => ({
            id: `step-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
            title: s.title,
            durationMinutes: Math.max(1, Math.min(10, s.durationMinutes || 3)),
            status: 'pending',
          })),
        }];
      }

      if (groups.length === 0) {
        throw new Error('No groups or steps in response');
      }

      const allSteps = groups.flatMap(g => g.steps);

      res.json({
        encouragement: parsed.encouragement || "Here's your first small step.",
        groups,
        steps: allSteps,
      });
    } else {
      throw new Error('No JSON in response');
    }
  } catch (err) {
    console.error('Breakdown API error:', err);
    const fallbackGroups = [
      {
        label: 'Getting started',
        emoji: '🌱',
        steps: [
          { id: `step-${Date.now()}-0`, title: 'Open the relevant materials', durationMinutes: 2, status: 'pending' },
          { id: `step-${Date.now()}-1`, title: 'Read or review the first section', durationMinutes: 5, status: 'pending' },
        ],
      },
      {
        label: 'Making progress',
        emoji: '📖',
        steps: [
          { id: `step-${Date.now()}-2`, title: 'Write down one key takeaway', durationMinutes: 3, status: 'pending' },
          { id: `step-${Date.now()}-3`, title: 'Note any questions you have', durationMinutes: 2, status: 'pending' },
        ],
      },
    ];
    res.json({
      encouragement: "Let's figure out the first small step.",
      groups: fallbackGroups,
      steps: fallbackGroups.flatMap(g => g.steps),
    });
  }
});

// ── Stuck Mode ──────────────────────────────────────────────────
app.post('/api/ai/stuck', async (req, res) => {
  const { stepTitle, userProfile } = req.body;

  const systemPrompt = `You are Focus Bridge. The user is stuck on a task step.
Suggest an even smaller, simpler "unstuck" micro-task to get them moving.
The user prefers tasks around ${userProfile.preferredTaskDuration} minutes.

Respond with ONLY valid JSON (no markdown):
{
  "message": "A warm, pressure-removing message (1 sentence)",
  "alternativeStep": {
    "title": "An extremely simple micro-task",
    "durationMinutes": 1
  }
}`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `I'm stuck on: "${stepTitle}"` },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      res.json({
        message: parsed.message,
        step: {
          id: `step-${Date.now()}`,
          title: parsed.alternativeStep?.title || `Just look at: ${stepTitle.toLowerCase()}`,
          durationMinutes: 1,
          status: 'pending',
        },
      });
    } else {
      throw new Error('No JSON in response');
    }
  } catch (err) {
    console.error('Stuck API error:', err);
    res.json({
      message: "No worries. Let's try something even smaller.",
      step: {
        id: `step-${Date.now()}`,
        title: `Just look at: ${stepTitle.toLowerCase()}`,
        durationMinutes: 1,
        status: 'pending',
      },
    });
  }
});

// ── Check-In ────────────────────────────────────────────────────
app.post('/api/ai/checkin', async (req, res) => {
  const { completedSteps, totalSteps, recentFeedback, goalTitle } = req.body;

  const systemPrompt = `You are Focus Bridge. Give a brief, supportive check-in message.
The user has completed ${completedSteps} of ${totalSteps} steps for "${goalTitle}".
Recent feedback: ${recentFeedback.join(', ') || 'none'}.
Be warm and encouraging. 1-2 sentences max. Never shame.`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'How should I check in with the user?' },
      ],
      temperature: 0.8,
      max_tokens: 100,
    });

    const message = completion.choices[0]?.message?.content?.trim()
      || "How's this feeling? I can adjust if needed.";
    res.json({ message });
  } catch (err) {
    console.error('Checkin API error:', err);
    res.json({ message: "How's this feeling? I can adjust if needed." });
  }
});

// ── Reflection Summary ──────────────────────────────────────────
app.post('/api/ai/reflection', async (req, res) => {
  const { goalTitle, completedSteps, totalMinutes, stuckCount, profile } = req.body;

  const systemPrompt = `You are Focus Bridge. Write a brief, warm reflection summary for the user's session.
Goal: "${goalTitle}"
Completed: ${completedSteps} steps | Total: ${totalMinutes} minutes | Adapted: ${stuckCount} times
User has completed ${profile.totalSessions} total sessions with ${profile.totalStepsCompleted} total steps.

Write 2-3 sentences. Be encouraging and highlight progress. Never be clinical.`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Write my reflection.' },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const summary = completion.choices[0]?.message?.content?.trim()
      || 'Every step you took matters. That\'s real progress.';
    res.json({ summary });
  } catch (err) {
    console.error('Reflection API error:', err);
    res.json({ summary: 'Every step you took matters. That\'s real progress.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Focus Bridge AI server running on http://localhost:${PORT}`);
});
