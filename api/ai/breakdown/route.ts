import { streamText, Output } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const featherless = createOpenAI({
  baseURL: 'https://api.featherless.ai/v1',
  apiKey: process.env.FEATHERLESS_API_KEY,
});

const MODEL = process.env.FEATHERLESS_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct';

const breakdownSchema = z.object({
  encouragement: z.string(),
  groups: z.array(z.object({
    label: z.string(),
    emoji: z.string(),
    steps: z.array(z.object({
      title: z.string(),
      durationMinutes: z.number(),
    })),
  })),
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const { goal, userProfile } = await req.json();

  const systemPrompt = `You are Focus Bridge, a calm and supportive AI assistant for people who struggle with procrastination.

Break down the user's goal into 2-4 groups. Each group has a label, an emoji, and 2-3 tiny steps.

Rules:
- Groups: warm labels + emoji (🌱 📖 ✍️ 🧹 💡 🎯 🔧 🎨)
- Steps: physical actions only (open, read, write, find, type, click) — never "plan" or "think"
- Each step: 1-5 minutes max
- Start each group with the tiniest possible first action
- Be warm and encouraging, never clinical
- The user has done ${userProfile.totalSessions} sessions, prefers ~${userProfile.preferredTaskDuration} min tasks`;

  const result = streamText({
    model: featherless(MODEL),
    output: Output.object({ schema: breakdownSchema }),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: goal },
    ],
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
