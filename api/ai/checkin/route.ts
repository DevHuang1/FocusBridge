import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const featherless = createOpenAI({
  baseURL: 'https://api.featherless.ai/v1',
  apiKey: process.env.FEATHERLESS_API_KEY,
});

const MODEL = process.env.FEATHERLESS_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct';

export async function POST(req: Request) {
  const { completedSteps, totalSteps, recentFeedback, goalTitle } = await req.json();

  try {
    const { text } = await generateText({
      model: featherless(MODEL),
      prompt: `You are Focus Bridge. Give a brief, supportive check-in message.
The user has completed ${completedSteps} of ${totalSteps} steps for "${goalTitle}".
Recent feedback: ${recentFeedback.join(', ') || 'none'}.
Be warm and encouraging. 1-2 sentences max. Never shame.`,
      temperature: 0.8,
    });

    return Response.json({ message: text.trim() || "How's this feeling? I can adjust if needed." });
  } catch {
    return Response.json({ message: "How's this feeling? I can adjust if needed." });
  }
}
