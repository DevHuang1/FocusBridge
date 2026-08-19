import { getDb } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';
import type {
  UserPreferences,
  WorkTask,
  PersistedTaskStep,
  Project,
  RoadmapNode,
  DailyCheckIn,
  DailyReflection,
  PersistedFocusSession,
  UserActivityEvent,
  AIPersonalizationProfile,
  ConsentSettings,
  AssemblyAuditRecord,
} from '../types';

// ─── Helpers ──────────────────────────────────────────────────────
function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): string {
  return new Date().toISOString();
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Preferences ──────────────────────────────────────────────────
export async function fetchPreferences(userId: string): Promise<UserPreferences | null> {
  const snap = await getDoc(doc(getDb(), 'user_preferences', userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    animationIntensity: data.animationIntensity ?? 'soft',
    colorTheme: data.colorTheme ?? 'sage',
    density: data.density ?? 'comfortable',
    guidanceStyle: data.guidanceStyle ?? 'brief',
    celebrationEffects: data.celebrationEffects ?? 'subtle',
    soundHaptics: data.soundHaptics ?? 'off',
    reducedMotion: data.reducedMotion ?? 'follow_system',
    aiAdaptation: data.aiAdaptation ?? 'suggestions_only',
    workRhythm: data.workRhythm ?? 'flexible',
    encouragementStyle: data.encouragementStyle ?? 'neutral',
    dailyCheckInEnabled: data.dailyCheckInEnabled ?? true,
    softStartEnabled: data.softStartEnabled ?? true,
    transitionBridgeEnabled: data.transitionBridgeEnabled ?? true,
  };
}

export async function savePreferences(userId: string, prefs: UserPreferences): Promise<void> {
  await setDoc(doc(getDb(), 'user_preferences', userId), {
    userId,
    theme: prefs.colorTheme,
    animationLevel: prefs.animationIntensity,
    density: prefs.density,
    guidanceStyle: prefs.guidanceStyle,
    celebrationEffects: prefs.celebrationEffects,
    soundHaptics: prefs.soundHaptics,
    reducedMotion: prefs.reducedMotion,
    aiAdaptation: prefs.aiAdaptation,
    workRhythm: prefs.workRhythm,
    encouragementStyle: prefs.encouragementStyle,
    dailyCheckInEnabled: prefs.dailyCheckInEnabled,
    softStartEnabled: prefs.softStartEnabled,
    transitionBridgeEnabled: prefs.transitionBridgeEnabled,
    updatedAt: now(),
  }, { merge: true });
}

// ─── Daily Check-Ins ──────────────────────────────────────────────
export async function fetchTodayCheckIn(userId: string): Promise<DailyCheckIn | null> {
  const q = query(
    collection(getDb(), 'daily_check_ins'),
    where('userId', '==', userId),
    where('date', '==', today()),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return {
    id: snap.docs[0].id,
    userId: data.userId,
    date: data.date,
    arrivalState: data.arrivalState,
    supportPreference: data.supportPreference,
    contextNote: data.contextNote,
    createdAt: data.createdAt,
  };
}

export async function saveCheckIn(userId: string, checkIn: Omit<DailyCheckIn, 'id' | 'userId' | 'createdAt'>): Promise<DailyCheckIn> {
  const id = uid();
  const createdAt = now();
  await setDoc(doc(getDb(), 'daily_check_ins', id), {
    userId,
    date: checkIn.date,
    arrivalState: checkIn.arrivalState,
    supportPreference: checkIn.supportPreference,
    contextNote: checkIn.contextNote ?? null,
    createdAt,
  });
  return { id, userId, ...checkIn, createdAt };
}

export async function deleteCheckIn(checkInId: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'daily_check_ins', checkInId));
}

// ─── Work Tasks ───────────────────────────────────────────────────
export async function fetchTasks(userId: string): Promise<WorkTask[]> {
  const q = query(
    collection(getDb(), 'tasks'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const r = d.data();
    return {
      id: d.id,
      userId: r.userId,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      scheduledFor: r.scheduledFor,
      parentId: r.parentId,
      sourceMilestoneId: r.sourceMilestoneId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });
}

export async function createTask(userId: string, task: { title: string; description?: string; priority?: WorkTask['priority']; scheduledFor?: string; parentId?: string; sourceMilestoneId?: string }): Promise<WorkTask> {
  const id = uid();
  const ts = now();
  await setDoc(doc(getDb(), 'tasks', id), {
    userId,
    title: task.title,
    description: task.description ?? null,
    status: 'pending',
    priority: task.priority ?? 'medium',
    scheduledFor: task.scheduledFor ?? null,
    parentId: task.parentId ?? null,
    sourceMilestoneId: task.sourceMilestoneId ?? null,
    createdAt: ts,
    updatedAt: ts,
  });
  return { id, userId, title: task.title, description: task.description, status: 'pending', priority: task.priority ?? 'medium', scheduledFor: task.scheduledFor, parentId: task.parentId, sourceMilestoneId: task.sourceMilestoneId, createdAt: ts, updatedAt: ts };
}

export async function updateTask(taskId: string, updates: Partial<Pick<WorkTask, 'title' | 'description' | 'status' | 'priority' | 'scheduledFor'>>): Promise<void> {
  const dbUpdates: Record<string, any> = { updatedAt: now() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.scheduledFor !== undefined) dbUpdates.scheduledFor = updates.scheduledFor;
  await updateDoc(doc(getDb(), 'tasks', taskId), dbUpdates);
}

export async function deleteTask(taskId: string): Promise<void> {
  const steps = await getDocs(query(collection(getDb(), 'task_steps'), where('taskId', '==', taskId)));
  const batch = writeBatch(getDb());
  steps.docs.forEach((s) => batch.delete(s.ref));
  batch.delete(doc(getDb(), 'tasks', taskId));
  await batch.commit();
}

// ─── Task Steps (tree breakdown) ─────────────────────────────────
export async function fetchTaskSteps(taskId: string): Promise<PersistedTaskStep[]> {
  const q = query(collection(getDb(), 'task_steps'), where('taskId', '==', taskId), orderBy('position'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const r = d.data();
    return {
      id: d.id,
      taskId: r.taskId,
      parentStepId: r.parentStepId,
      title: r.title,
      instructions: r.instructions,
      status: r.status,
      position: r.position,
      effortRange: r.effortRange,
      durationMinutes: r.durationMinutes,
      microStep: r.microStep,
      notes: r.notes,
    };
  });
}

export async function saveTaskSteps(taskId: string, steps: Omit<PersistedTaskStep, 'id' | 'taskId'>[]): Promise<void> {
  const existing = await getDocs(query(collection(getDb(), 'task_steps'), where('taskId', '==', taskId)));
  const batch = writeBatch(getDb());
  existing.docs.forEach((s) => batch.delete(s.ref));
  steps.forEach((s, i) => {
    const ref = doc(getDb(), 'task_steps', uid());
    batch.set(ref, {
      taskId,
      parentStepId: s.parentStepId ?? null,
      title: s.title,
      instructions: s.instructions ?? null,
      status: s.status,
      position: s.position ?? i,
      effortRange: s.effortRange ?? null,
      durationMinutes: s.durationMinutes ?? null,
      microStep: s.microStep ?? null,
      notes: s.notes ?? null,
    });
  });
  await batch.commit();
}

// ─── Projects (Planning) ─────────────────────────────────────────
export async function fetchProjects(userId: string): Promise<Project[]> {
  const q = query(collection(getDb(), 'projects'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const r = d.data();
    return {
      id: d.id,
      userId: r.userId,
      title: r.title,
      description: r.description,
      status: r.status,
      targetDate: r.targetDate,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });
}

export async function createProject(userId: string, project: { title: string; description?: string; targetDate?: string }): Promise<Project> {
  const id = uid();
  const ts = now();
  await setDoc(doc(getDb(), 'projects', id), {
    userId,
    title: project.title,
    description: project.description ?? null,
    status: 'active',
    targetDate: project.targetDate ?? null,
    createdAt: ts,
    updatedAt: ts,
  });
  return { id, userId, title: project.title, description: project.description, status: 'active', targetDate: project.targetDate, createdAt: ts, updatedAt: ts };
}

export async function updateProject(projectId: string, updates: Partial<Pick<Project, 'title' | 'description' | 'status' | 'targetDate'>>): Promise<void> {
  const dbUpdates: Record<string, any> = { updatedAt: now() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.targetDate !== undefined) dbUpdates.targetDate = updates.targetDate;
  await updateDoc(doc(getDb(), 'projects', projectId), dbUpdates);
}

export async function deleteProject(projectId: string): Promise<void> {
  const nodes = await getDocs(query(collection(getDb(), 'roadmap_nodes'), where('projectId', '==', projectId)));
  const batch = writeBatch(getDb());
  nodes.docs.forEach((n) => batch.delete(n.ref));
  batch.delete(doc(getDb(), 'projects', projectId));
  await batch.commit();
}

// ─── Roadmap Nodes ────────────────────────────────────────────────
export async function fetchRoadmapNodes(projectId: string): Promise<RoadmapNode[]> {
  const q = query(collection(getDb(), 'roadmap_nodes'), where('projectId', '==', projectId), orderBy('position'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const r = d.data();
    return {
      id: d.id,
      projectId: r.projectId,
      title: r.title,
      outcome: r.outcome,
      whyItMatters: r.whyItMatters,
      instructions: r.instructions,
      checklist: r.checklist,
      position: r.position,
      status: r.status,
      dependencies: r.dependencies,
      suggestedTimeframe: r.suggestedTimeframe,
      definitionOfDone: r.definitionOfDone,
      potentialObstacles: r.potentialObstacles,
      fallbackPath: r.fallbackPath,
      nextMilestoneId: r.nextMilestoneId,
      createdAt: r.createdAt,
    };
  });
}

export async function saveRoadmapNodes(projectId: string, nodes: Omit<RoadmapNode, 'id' | 'projectId' | 'createdAt'>[]): Promise<void> {
  const existing = await getDocs(query(collection(getDb(), 'roadmap_nodes'), where('projectId', '==', projectId)));
  const batch = writeBatch(getDb());
  existing.docs.forEach((n) => batch.delete(n.ref));
  nodes.forEach((n, i) => {
    const ref = doc(getDb(), 'roadmap_nodes', uid());
    batch.set(ref, {
      projectId,
      title: n.title,
      outcome: n.outcome ?? null,
      whyItMatters: n.whyItMatters ?? null,
      instructions: n.instructions ?? null,
      checklist: n.checklist ?? null,
      position: n.position ?? i,
      status: n.status ?? 'pending',
      dependencies: n.dependencies ?? null,
      suggestedTimeframe: n.suggestedTimeframe ?? null,
      definitionOfDone: n.definitionOfDone ?? null,
      potentialObstacles: n.potentialObstacles ?? null,
      fallbackPath: n.fallbackPath ?? null,
      nextMilestoneId: n.nextMilestoneId ?? null,
      createdAt: now(),
    });
  });
  await batch.commit();
}

export async function updateRoadmapNode(nodeId: string, updates: Partial<RoadmapNode>): Promise<void> {
  const dbUpdates: Record<string, any> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.outcome !== undefined) dbUpdates.outcome = updates.outcome;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.instructions !== undefined) dbUpdates.instructions = updates.instructions;
  if (updates.position !== undefined) dbUpdates.position = updates.position;
  await updateDoc(doc(getDb(), 'roadmap_nodes', nodeId), dbUpdates);
}

// ─── Focus Sessions ──────────────────────────────────────────────
export async function fetchRecentSessions(userId: string, limitCount = 10): Promise<PersistedFocusSession[]> {
  const q = query(collection(getDb(), 'focus_sessions'), where('userId', '==', userId), orderBy('startedAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const r = d.data();
    return {
      id: d.id,
      userId: r.userId,
      taskId: r.taskId,
      startedAt: r.startedAt,
      endedAt: r.endedAt,
      durationSeconds: r.durationSeconds,
      status: r.status,
    };
  });
}

export async function createFocusSession(userId: string, taskId?: string): Promise<string> {
  const id = uid();
  await setDoc(doc(getDb(), 'focus_sessions', id), {
    userId,
    taskId: taskId ?? null,
    startedAt: now(),
    status: 'active',
  });
  return id;
}

export async function endFocusSession(sessionId: string, durationSeconds: number): Promise<void> {
  await updateDoc(doc(getDb(), 'focus_sessions', sessionId), {
    endedAt: now(),
    durationSeconds,
    status: 'completed',
  });
}

// ─── Daily Reflections ───────────────────────────────────────────
export async function fetchTodayReflection(userId: string): Promise<DailyReflection | null> {
  const q = query(collection(getDb(), 'daily_reflections'), where('userId', '==', userId), where('date', '==', today()), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return {
    id: snap.docs[0].id,
    userId: data.userId,
    date: data.date,
    completedSummary: data.completedSummary,
    difficultyNote: data.difficultyNote,
    tomorrowNote: data.tomorrowNote,
    createdAt: data.createdAt,
  };
}

export async function saveReflection(userId: string, reflection: { completedSummary?: string; difficultyNote?: string; tomorrowNote?: string }): Promise<void> {
  const existing = await getDocs(query(collection(getDb(), 'daily_reflections'), where('userId', '==', userId), where('date', '==', today()), limit(1)));
  const id = existing.empty ? uid() : existing.docs[0].id;
  await setDoc(doc(getDb(), 'daily_reflections', id), {
    userId,
    date: today(),
    completedSummary: reflection.completedSummary ?? null,
    difficultyNote: reflection.difficultyNote ?? null,
    tomorrowNote: reflection.tomorrowNote ?? null,
    createdAt: now(),
  }, { merge: true });
}

// ─── Activity Tracking ──────────────────────────────────────────
export async function insertActivityEvent(event: UserActivityEvent): Promise<boolean> {
  try {
    await setDoc(doc(getDb(), 'user_activity_events', event.id), {
      userId: event.userId,
      sessionId: event.sessionId ?? null,
      eventName: event.eventName,
      occurredAt: event.occurredAt,
      timezone: event.timezone ?? null,
      source: event.source,
      screen: event.screen ?? null,
      objectType: event.objectType ?? null,
      objectId: event.objectId ?? null,
      properties: event.properties ?? {},
      sensitivity: event.sensitivity,
      idempotencyKey: event.id,
    });
    return true;
  } catch (error) {
    console.error('Failed to insert activity event:', error);
    return false;
  }
}

export async function fetchActivityEvents(userId: string, limitCount = 50): Promise<UserActivityEvent[]> {
  const q = query(collection(getDb(), 'user_activity_events'), where('userId', '==', userId), orderBy('occurredAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const r = d.data();
    return {
      id: d.id,
      userId: r.userId,
      sessionId: r.sessionId ?? undefined,
      eventName: r.eventName as UserActivityEvent['eventName'],
      occurredAt: r.occurredAt,
      source: r.source,
      screen: r.screen ?? undefined,
      objectType: r.objectType ?? undefined,
      objectId: r.objectId ?? undefined,
      properties: r.properties ?? {},
      sensitivity: r.sensitivity ?? 'standard',
      consentContext: {
        interactionHistory: false,
        aiPersonalization: false,
        dailyCheckInContext: false,
        conversationMemory: false,
      },
    };
  });
}

export async function fetchConsentStatus(userId: string): Promise<ConsentSettings | null> {
  const snap = await getDoc(doc(getDb(), 'activity_tracking_preferences', userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    interactionHistory: data.interactionHistory ?? false,
    aiPersonalization: data.aiPersonalization ?? false,
    dailyCheckInContext: data.dailyCheckInContext ?? false,
    conversationMemory: data.conversationMemory ?? false,
    technicalDiagnostics: data.technicalDiagnostics ?? true,
    consentVersion: data.consentVersion ?? '1.0',
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export async function saveConsentStatus(userId: string, consent: ConsentSettings, hasConsented: boolean): Promise<void> {
  await setDoc(doc(getDb(), 'activity_tracking_preferences', userId), {
    userId,
    interactionHistory: consent.interactionHistory,
    aiPersonalization: consent.aiPersonalization,
    dailyCheckInContext: consent.dailyCheckInContext,
    conversationMemory: consent.conversationMemory,
    technicalDiagnostics: consent.technicalDiagnostics,
    consentVersion: consent.consentVersion ?? '1.0',
    hasConsented,
    updatedAt: now(),
  }, { merge: true });
}

export async function fetchPersonalizationProfile(userId: string): Promise<AIPersonalizationProfile | null> {
  const snap = await getDoc(doc(getDb(), 'ai_personalization_profiles', userId));
  if (!snap.exists()) return null;
  return snap.data().profile as AIPersonalizationProfile;
}

export async function savePersonalizationProfile(userId: string, profile: AIPersonalizationProfile): Promise<void> {
  await setDoc(doc(getDb(), 'ai_personalization_profiles', userId), {
    userId,
    profile,
    lastUpdatedAt: now(),
  }, { merge: true });
}

export async function deleteActivityHistory(userId: string): Promise<void> {
  const q = query(collection(getDb(), 'user_activity_events'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const batch = writeBatch(getDb());
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function resetPersonalizationProfile(userId: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'ai_personalization_profiles', userId));
}

export async function logAIFeedback(userId: string, feedback: { suggestionType?: string; outcome: 'accepted' | 'edited' | 'dismissed' | 'rejected'; sourceEvent?: string }): Promise<void> {
  await setDoc(doc(getDb(), 'ai_interaction_feedback', uid()), {
    userId,
    suggestionType: feedback.suggestionType ?? null,
    outcome: feedback.outcome,
    sourceEvent: feedback.sourceEvent ?? null,
    createdAt: now(),
  });
}

export async function writeContextAudit(record: AssemblyAuditRecord): Promise<void> {
  await setDoc(doc(getDb(), 'ai_context_audit', uid()), {
    requestId: record.requestId,
    userId: record.userId,
    schemaVersion: record.schemaVersion,
    intent: record.intent,
    consentApplied: record.consentApplied,
    categoriesIncluded: record.categoriesIncluded,
    categoriesExcluded: record.categoriesExcluded,
    eventsConsidered: record.eventsConsidered,
    eventsIncluded: record.eventsIncluded,
    redactionsByCategory: record.redactionsByCategory,
    estimatedTokens: record.estimatedTokens,
    outcome: record.outcome,
    failureCategory: record.failureCategory ?? null,
    createdAt: now(),
  });
}