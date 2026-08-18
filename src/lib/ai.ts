import type { TaskStep, FeedbackLevel, UserProfile } from '../types';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const featherless = createOpenAI({
  baseURL: 'https://api.featherless.ai/v1',
  apiKey: import.meta.env.VITE_FEATHERLESS_API_KEY,
});

const MODEL = 'Qwen/Qwen3-8B';

let stepIdCounter = 0;
function nextStepId(): string {
  return `step-${++stepIdCounter}`;
}

function extractJsonArray(text: string): any[] | null {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]); } catch {}
  }

  return null;
}

function extractJsonObject(text: string): Record<string, any> | null {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try { return JSON.parse(objectMatch[0]); } catch {}
  }

  return null;
}

const encouragementMessages = [
  "That's a lot to think about. Let's just figure out the first step.",
  "Okay, let's make this feel lighter.",
  "Let's break this into something you can start right now.",
  "We don't need to do everything. Just the next small thing.",
  "Let's turn this into something manageable.",
];

function generateSmallerStep(currentStep: TaskStep): TaskStep {
  const newDuration = Math.max(1, Math.round(currentStep.durationMinutes * 0.4));
  return {
    ...currentStep,
    id: nextStepId(),
    title: currentStep.title,
    durationMinutes: newDuration,
    status: 'pending',
    originalDuration: currentStep.originalDuration ?? currentStep.durationMinutes,
  };
}

function generateCheckIn(completedSteps: number, totalSteps: number, recentFeedback: FeedbackLevel[]): string {
  const ratio = completedSteps / totalSteps;

  if (recentFeedback.includes('too_much')) {
    return "Taking it slow is completely fine. You're still moving forward.";
  }
  if (completedSteps === 0) {
    return "Ready when you are. No rush.";
  }
  if (ratio >= 0.8) {
    return "Almost there. You've done enough to be proud of today.";
  }
  if (recentFeedback.includes('easy')) {
    return "That felt doable. Want to keep going?";
  }
  if (completedSteps >= 3) {
    return "You've completed a few steps. Want to keep going or take a break?";
  }
  return "How's this feeling? I can adjust if needed.";
}

export const aiService = {
  generateSmallerStep,
  generateCheckIn,
  extractJsonArray,
  extractJsonObject,
  getRandomEncouragement(): string {
    return encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
  },

  async generateBreakdown(goal: string, _profile: UserProfile): Promise<string> {
    const { text } = await generateText({
      model: featherless.chat(MODEL),
      system: `You are a gentle, encouraging productivity assistant. Your ONLY job is to break down goals into micro-steps.

RULES:
- Output ONLY a raw JSON array. No explanation, no markdown, no code blocks.
- Each object has "title" (string, 5-15 words) and "durationMinutes" (number, 1-5).
- 3 to 5 steps. Start with the absolute easiest first step.
- Steps must be specific and actionable for the user's goal.

Example output:
[{"title":"Fill a pot with water and put it on the stove","durationMinutes":2},{"title":"Add salt and bring water to a boil","durationMinutes":5}]`,
      prompt: `Break down: ${goal}`,
    });
    return text;
  },

  async generateStuckAlternative(stepTitle: string): Promise<string> {
    const { text } = await generateText({
      model: featherless.chat(MODEL),
      system: `The user is stuck on a task. Output ONLY a raw JSON object. No explanation, no markdown.
Object has "title" (string) and "durationMinutes" (number, always 1).
Make it the tiniest possible version of the task.`,
      prompt: `Stuck on: ${stepTitle}`,
    });
    return text;
  },

  async generateEasierAlternative(stepTitle: string): Promise<string> {
    const { text } = await generateText({
      model: featherless.chat(MODEL),
      system: `The user wants an easier version of a task. Output ONLY a raw JSON object. No explanation, no markdown.
Object has "title" (string, a gentler/simpler rewording) and "durationMinutes" (number, 1-3).
Make it feel less intimidating while keeping the same intent.`,
      prompt: `Make easier: ${stepTitle}`,
    });
    return text;
  },

  async generateSessionSummary(session: { goalTitle: string; steps: TaskStep[]; completedAt?: string }): Promise<string> {
    const { text } = await generateText({
      model: featherless.chat(MODEL),
      system: `You are a warm, supportive coach. Write a 2-sentence summary of this focus session.
Highlight what was accomplished and offer one small word of encouragement.
Keep it concise and gentle.`,
      prompt: `Goal: ${session.goalTitle}. 
Completed steps: ${session.steps.filter(s => s.status === 'completed').map(s => s.title).join(', ')}.
Session finished: ${session.completedAt ? 'Yes' : 'No (partial)'}.`,
    });
    return text;
  }
};
