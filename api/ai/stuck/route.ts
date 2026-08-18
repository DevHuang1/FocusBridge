import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const featherless = createOpenAI({
  baseURL: 'https://api.featherless.ai/v1',
  apiKey: process.env.FEATHERLESS_API_KEY,
});

const MODEL = process.env.FEATHERLESS_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct';

export async function POST(req: Request) {
  const { stepTitle, userProfile } = await req.json();

  try {
    const { object } = await generateObject({
      model: featherless(MODEL),
      schema: z.object({
        message: z.string(),
        alternativeStep: z.object({
          title: z.string(),
          durationMinutes: z.number(),
        }),
      }),
      messages: [
        {
          role: 'system',
          content: `You are Focus Bridge. The user is stuck on a task step.
Suggest an even smaller, simpler "unstuck" micro-task to get them moving.
The user prefers tasks around ${userProfile.preferredTaskDuration} minutes.
Be warm and pressure-removing. 1 sentence max for the message.`,
        },
        { role: 'user', content: `I'm stuck on: "${stepTitle}"` },
      ],
      temperature: 0.8,
    });

    return Response.json({
      message: object.message,
      step: {
        id: `step-${Date.now()}`,
        title: object.alternativeStep.title,
        durationMinutes: Math.max(1, object.alternativeStep.durationMinutes),
        status: 'pending',
      },
    });
  } catch {
    return Response.json({
      message: "No worries. Let's try something even smaller.",
      step: {
        id: `step-${Date.now()}`,
        title: `Just look at: ${stepTitle.toLowerCase()}`,
        durationMinutes: 1,
        status: 'pending',
      },
    });
  }
}
