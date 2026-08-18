import type { TaskStep, FeedbackLevel } from '../types';

let stepIdCounter = 0;
function nextStepId(): string {
  return `step-${++stepIdCounter}`;
}

interface BreakdownResult {
  encouragement: string;
  steps: TaskStep[];
}

const encouragementMessages = [
  "That's a lot to think about. Let's just figure out the first step.",
  "Okay, let's make this feel lighter.",
  "Let's break this into something you can start right now.",
  "We don't need to do everything. Just the next small thing.",
  "Let's turn this into something manageable.",
];

const stuckResponses = [
  "That's okay. Let's remove the pressure.",
  "No worries. Let's try something even smaller.",
  "Forget the original plan for a moment.",
  "Let's simplify this completely.",
];

const genericBreakdowns: Record<string, BreakdownResult> = {
  default: {
    encouragement: "Let's figure out the first small step.",
    steps: [
      { id: nextStepId(), title: "Open the relevant materials", durationMinutes: 2, status: 'pending' },
      { id: nextStepId(), title: "Read or review the first section", durationMinutes: 5, status: 'pending' },
      { id: nextStepId(), title: "Write down one key takeaway", durationMinutes: 3, status: 'pending' },
    ],
  },
};

function classifyGoal(goal: string): string | null {
  const lower = goal.toLowerCase();
  if (lower.includes('study') || lower.includes('exam') || lower.includes('test') || lower.includes('learn') || lower.includes('read') || lower.includes('review')) return 'study';
  if (lower.includes('write') || lower.includes('essay') || lower.includes('paper') || lower.includes('report') || lower.includes('document')) return 'write';
  if (lower.includes('clean') || lower.includes('organize') || lower.includes('tidy') || lower.includes('sort')) return 'clean';
  if (lower.includes('present') || lower.includes('slides') || lower.includes('deck')) return 'presentation';
  if (lower.includes('email') || lower.includes('reply') || lower.includes('message') || lower.includes('send')) return 'communication';
  if (lower.includes('exercise') || lower.includes('workout') || lower.includes('run') || lower.includes('walk')) return 'exercise';
  if (lower.includes('code') || lower.includes('program') || lower.includes('develop') || lower.includes('build') || lower.includes('fix') || lower.includes('debug')) return 'coding';
  return null;
}

function generateBreakdown(goal: string): BreakdownResult {
  const category = classifyGoal(goal);
  const goalLower = goal.toLowerCase();
  const minutes = (n: number) => Math.round(n);

  switch (category) {
    case 'study': {
      const isExam = goalLower.includes('exam') || goalLower.includes('test');
      return {
        encouragement: isExam
          ? "That's a lot to think about. Let's just figure out the first step."
          : "Let's make this feel lighter.",
        steps: [
          { id: nextStepId(), title: "Find your notes or textbook for this subject", durationMinutes: minutes(2), status: 'pending' },
          { id: nextStepId(), title: "Skim the table of contents or chapter headings", durationMinutes: minutes(3), status: 'pending' },
          { id: nextStepId(), title: "Pick the first topic that feels most relevant", durationMinutes: minutes(2), status: 'pending' },
          { id: nextStepId(), title: "Read just the first page or section", durationMinutes: minutes(5), status: 'pending' },
        ],
      };
    }
    case 'write': {
      return {
        encouragement: "Let's break this into something you can start right now.",
        steps: [
          { id: nextStepId(), title: "Open a blank document and write a title", durationMinutes: minutes(2), status: 'pending' },
          { id: nextStepId(), title: "Write 2–3 bullet points of what you want to say", durationMinutes: minutes(3), status: 'pending' },
          { id: nextStepId(), title: "Write the first sentence, even if it's messy", durationMinutes: minutes(3), status: 'pending' },
        ],
      };
    }
    case 'clean': {
      return {
        encouragement: "We don't need to do everything. Just the next small thing.",
        steps: [
          { id: nextStepId(), title: "Pick one small area to start with", durationMinutes: minutes(1), status: 'pending' },
          { id: nextStepId(), title: "Clear just that one area", durationMinutes: minutes(5), status: 'pending' },
          { id: nextStepId(), title: "Put things in their place or in a 'deal with later' box", durationMinutes: minutes(3), status: 'pending' },
        ],
      };
    }
    case 'presentation': {
      return {
        encouragement: "Let's make this manageable, one slide at a time.",
        steps: [
          { id: nextStepId(), title: "Open your presentation file", durationMinutes: minutes(1), status: 'pending' },
          { id: nextStepId(), title: "Write the title slide", durationMinutes: minutes(3), status: 'pending' },
          { id: nextStepId(), title: "Add the three main points as headings", durationMinutes: minutes(5), status: 'pending' },
          { id: nextStepId(), title: "Find one image or visual to support a point", durationMinutes: minutes(5), status: 'pending' },
          { id: nextStepId(), title: "Review what you have so far", durationMinutes: minutes(5), status: 'pending' },
        ],
      };
    }
    case 'communication': {
      return {
        encouragement: "Let's get one message out. That's enough.",
        steps: [
          { id: nextStepId(), title: "Open your email or messaging app", durationMinutes: minutes(1), status: 'pending' },
          { id: nextStepId(), title: "Find the message you need to respond to", durationMinutes: minutes(2), status: 'pending' },
          { id: nextStepId(), title: "Write a short reply — even just 'Got it, thanks!'", durationMinutes: minutes(2), status: 'pending' },
        ],
      };
    }
    case 'exercise': {
      return {
        encouragement: "Any movement counts. Let's start tiny.",
        steps: [
          { id: nextStepId(), title: "Put on comfortable clothes or shoes", durationMinutes: minutes(2), status: 'pending' },
          { id: nextStepId(), title: "Step outside or to your workout spot", durationMinutes: minutes(1), status: 'pending' },
          { id: nextStepId(), title: "Move for just 5 minutes — walk, stretch, anything", durationMinutes: minutes(5), status: 'pending' },
        ],
      };
    }
    case 'coding': {
      return {
        encouragement: "Let's start with just opening the project.",
        steps: [
          { id: nextStepId(), title: "Open your code editor and the project", durationMinutes: minutes(2), status: 'pending' },
          { id: nextStepId(), title: "Read the error message or the code that needs changing", durationMinutes: minutes(3), status: 'pending' },
          { id: nextStepId(), title: "Make one small change or write one function", durationMinutes: minutes(5), status: 'pending' },
        ],
      };
    }
    default:
      return genericBreakdowns.default;
  }
}

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

function generateStuckAlternative(currentStep: TaskStep): { message: string; step: TaskStep } {
  const messages = stuckResponses;
  const message = messages[Math.floor(Math.random() * messages.length)];

  const simplifications: Record<string, string> = {
    'Find': 'Just find',
    'Read': 'Just look at the first paragraph of',
    'Write': 'Just write one word for',
    'Open': 'Just open',
    'Review': 'Just glance at',
    'Add': 'Just look at',
  };

  let simplifiedTitle = currentStep.title;
  for (const [key, replacement] of Object.entries(simplifications)) {
    if (simplifiedTitle.startsWith(key)) {
      simplifiedTitle = replacement + simplifiedTitle.slice(key.length);
      break;
    }
  }
  if (simplifiedTitle === currentStep.title) {
    simplifiedTitle = `Just look at: ${currentStep.title.toLowerCase()}`;
  }

  return {
    message,
    step: {
      id: nextStepId(),
      title: simplifiedTitle,
      durationMinutes: 1,
      status: 'pending',
    },
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
  generateBreakdown,
  generateSmallerStep,
  generateStuckAlternative,
  generateCheckIn,
  getRandomEncouragement(): string {
    return encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
  },
};
