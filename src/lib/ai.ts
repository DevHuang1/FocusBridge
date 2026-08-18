import type { TaskStep, StepGroup, UserProfile } from "../types";
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const featherless = createOpenAI({
  baseURL: 'https://api.featherless.ai/v1',
  apiKey: import.meta.env.VITE_FEATHERLESS_API_KEY,
});

const MODEL = 'Qwen/Qwen3-8B';

export interface BreakdownResult {
  encouragement: string;
  steps: TaskStep[];
  groups: StepGroup[];
}

export interface StuckResult {
  message: string;
  step: TaskStep;
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

async function generateBreakdown(goal: string, _profile: UserProfile): Promise<string> {
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
}

async function generateStuckAlternative(stepTitle: string): Promise<string> {
  const { text } = await generateText({
    model: featherless.chat(MODEL),
    system: `The user is stuck on a task. Output ONLY a raw JSON object. No explanation, no markdown.
Object has "title" (string) and "durationMinutes" (number, always 1).
Make it the tiniest possible version of the task.`,
    prompt: `Stuck on: ${stepTitle}`,
  });
  return text;
}

async function generateEasierAlternative(stepTitle: string): Promise<string> {
  const { text } = await generateText({
    model: featherless.chat(MODEL),
    system: `The user wants an easier version of a task. Output ONLY a raw JSON object. No explanation, no markdown.
Object has "title" (string, a gentler/simpler rewording) and "durationMinutes" (number, 1-3).
Make it feel less intimidating while keeping the same intent.`,
    prompt: `Make easier: ${stepTitle}`,
  });
  return text;
}

async function generateSessionSummary(session: { goalTitle: string; steps: TaskStep[]; completedAt?: string }): Promise<string> {
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

function generateSmallerStep(currentStep: TaskStep): TaskStep {
  const newDuration = Math.max(1, Math.round(currentStep.durationMinutes * 0.4));
  return {
    ...currentStep,
    id: `step-${Date.now()}`,
    title: currentStep.title,
    durationMinutes: newDuration,
    status: "pending",
    originalDuration: currentStep.originalDuration ?? currentStep.durationMinutes,
  };
}

export const aiService = {
  generateSmallerStep,
  extractJsonArray,
  extractJsonObject,
  getRandomEncouragement(): string {
    return encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
  },
  generateBreakdown,
  generateStuckAlternative,
  generateEasierAlternative,
  generateSessionSummary,
};
