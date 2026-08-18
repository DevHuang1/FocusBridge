import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const featherless = createOpenAI({
  baseURL: 'https://api.featherless.ai/v1',
  apiKey: process.env.FEATHERLESS_API_KEY,
});

const MODEL = process.env.FEATHERLESS_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct';

export async function POST(req: Request) {
  const { goalTitle, completedSteps, totalMinutes, stuckCount, profile } = await req.json();

  try {
    const { text } = await generateText({
      model: featherless(MODEL),
      prompt: `You are Focus Bridge. Write a brief, warm reflection summary for the user's session.
Goal: "${goalTitle}"
Completed: ${completedSteps} steps | Total: ${totalMinutes} minutes | Adapted: ${stuckCount} times
User has completed ${profile.totalSessions} total sessions with ${profile.totalStepsCompleted} total steps.

Write 2-3 sentences. Be encouraging and highlight progress. Never be clinical.`,
      temperature: 0.8,
    });

    return Response.json({ summary: text.trim() || "Every step you took matters. That's real progress." });
  } catch {
    return Response.json({ summary: "Every step you took matters. That's real progress." });
  }
}
