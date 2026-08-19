import { useConsentStore } from '../store/useConsentStore';
import { useAppStore } from '../store/useAppStore';
import { fetchConsentStatus } from './data';
import { getActiveUserId } from './activity';
import { AIContextAssemblyEngine, type AssemblyResult } from './contextEngine';
import type { AIContextEnvelope, AssembleContextRequest } from '../types';

const engine = new AIContextAssemblyEngine();

export type { AssemblyResult };

export async function ensureConsentSynced(): Promise<void> {
  const userId = getActiveUserId();
  if (!userId) return;
  try {
    const stored = await fetchConsentStatus(userId);
    if (stored) {
      useConsentStore.setState((s) => ({
        consent: { ...s.consent, ...stored, consentVersion: stored.consentVersion ?? '1.0' },
        hasConsented: true,
      }));
    }
  } catch {}
}

export function buildAssembleRequest(userMessage: string, requestId?: string): AssembleContextRequest {
  const userId = getActiveUserId() ?? '';
  const { screen, currentSession } = useAppStore.getState();

  const request: AssembleContextRequest = {
    userId,
    requestId: requestId ?? crypto.randomUUID(),
    userMessage,
    currentScreen: screen,
    clientTimestamp: new Date().toISOString(),
  };

  if (currentSession) {
    const step = currentSession.steps[currentSession.currentStepIndex];
    if (step) request.activeTaskStepId = step.id;
  }

  return request;
}

export async function assembleContextForRequest(userMessage: string): Promise<AssemblyResult> {
  const request = buildAssembleRequest(userMessage);
  return engine.assemble(request);
}

export async function assembleContextForBreakdown(userMessage: string): Promise<{ envelope: AIContextEnvelope }> {
  const result = await assembleContextForRequest(userMessage);
  return { envelope: result.envelope };
}