import type { AppState } from '../types';

const STORAGE_KEY = 'focusbridge_state';

type PersistedState = Pick<AppState, 'profile' | 'goals' | 'currentSession'>;

export function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
