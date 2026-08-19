import { supabase } from './supabase';
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
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    animationIntensity: data.animation_level ?? 'soft',
    colorTheme: data.theme ?? 'sage',
    density: data.density ?? 'comfortable',
    guidanceStyle: data.guidance_style ?? 'brief',
    celebrationEffects: data.celebration_effects ?? 'subtle',
    soundHaptics: data.sound_haptics ?? 'off',
    reducedMotion: data.reduced_motion ?? 'follow_system',
    aiAdaptation: data.ai_adaptation ?? 'suggestions_only',
    workRhythm: data.work_rhythm ?? 'flexible',
    encouragementStyle: data.encouragement_style ?? 'neutral',
    dailyCheckInEnabled: data.daily_check_in_enabled ?? true,
  };
}

export async function savePreferences(userId: string, prefs: UserPreferences): Promise<void> {
  const { error } = await supabase.from('user_preferences').upsert({
    user_id: userId,
    theme: prefs.colorTheme,
    animation_level: prefs.animationIntensity,
    density: prefs.density,
    guidance_style: prefs.guidanceStyle,
    celebration_effects: prefs.celebrationEffects,
    sound_haptics: prefs.soundHaptics,
    reduced_motion: prefs.reducedMotion,
    ai_adaptation: prefs.aiAdaptation,
    work_rhythm: prefs.workRhythm,
    encouragement_style: prefs.encouragementStyle,
    daily_check_in_enabled: prefs.dailyCheckInEnabled,
    updated_at: now(),
  }, { onConflict: 'user_id' });
  if (error) console.error('Failed to save preferences:', error);
}

// ─── Daily Check-Ins ──────────────────────────────────────────────
export async function fetchTodayCheckIn(userId: string): Promise<DailyCheckIn | null> {
  const { data } = await supabase
    .from('daily_check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today())
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    arrivalState: data.state,
    supportPreference: data.support_preference,
    contextNote: data.context_note,
    createdAt: data.created_at,
  };
}

export async function saveCheckIn(userId: string, checkIn: Omit<DailyCheckIn, 'id' | 'userId' | 'createdAt'>): Promise<DailyCheckIn> {
  const id = uid();
  const { error } = await supabase.from('daily_check_ins').insert({
    id,
    user_id: userId,
    date: checkIn.date,
    state: checkIn.arrivalState,
    support_preference: checkIn.supportPreference,
    context_note: checkIn.contextNote,
    created_at: now(),
  });
  if (error) console.error('Failed to save check-in:', error);
  return { id, userId, ...checkIn, createdAt: now() };
}

export async function deleteCheckIn(checkInId: string): Promise<void> {
  await supabase.from('daily_check_ins').delete().eq('id', checkInId);
}

// ─── Work Tasks ───────────────────────────────────────────────────
export async function fetchTasks(userId: string): Promise<WorkTask[]> {
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    scheduledFor: r.scheduled_for,
    parentId: r.parent_id,
    sourceMilestoneId: r.source_milestone_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createTask(userId: string, task: { title: string; description?: string; priority?: WorkTask['priority']; scheduledFor?: string; parentId?: string; sourceMilestoneId?: string }): Promise<WorkTask> {
  const id = uid();
  const ts = now();
  const { error } = await supabase.from('tasks').insert({
    id,
    user_id: userId,
    title: task.title,
    description: task.description ?? null,
    status: 'pending',
    priority: task.priority ?? 'medium',
    scheduled_for: task.scheduledFor ?? null,
    parent_id: task.parentId ?? null,
    source_milestone_id: task.sourceMilestoneId ?? null,
    created_at: ts,
    updated_at: ts,
  });
  if (error) console.error('Failed to create task:', error);
  return { id, userId, title: task.title, description: task.description, status: 'pending', priority: task.priority ?? 'medium', scheduledFor: task.scheduledFor, parentId: task.parentId, sourceMilestoneId: task.sourceMilestoneId, createdAt: ts, updatedAt: ts };
}

export async function updateTask(taskId: string, updates: Partial<Pick<WorkTask, 'title' | 'description' | 'status' | 'priority' | 'scheduledFor'>>): Promise<void> {
  const dbUpdates: Record<string, any> = { updated_at: now() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.scheduledFor !== undefined) dbUpdates.scheduled_for = updates.scheduledFor;
  await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
}

export async function deleteTask(taskId: string): Promise<void> {
  await supabase.from('task_steps').delete().eq('task_id', taskId);
  await supabase.from('tasks').delete().eq('id', taskId);
}

// ─── Task Steps (tree breakdown) ─────────────────────────────────
export async function fetchTaskSteps(taskId: string): Promise<PersistedTaskStep[]> {
  const { data } = await supabase
    .from('task_steps')
    .select('*')
    .eq('task_id', taskId)
    .order('position');
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    taskId: r.task_id,
    parentStepId: r.parent_step_id,
    title: r.title,
    instructions: r.instructions,
    status: r.status,
    position: r.position,
    effortRange: r.effort_range,
    durationMinutes: r.duration_minutes,
    microStep: r.micro_step,
    notes: r.notes,
  }));
}

export async function saveTaskSteps(taskId: string, steps: Omit<PersistedTaskStep, 'id' | 'taskId'>[]): Promise<void> {
  await supabase.from('task_steps').delete().eq('task_id', taskId);
  const rows = steps.map((s, i) => ({
    id: uid(),
    task_id: taskId,
    parent_step_id: s.parentStepId ?? null,
    title: s.title,
    instructions: s.instructions ?? null,
    status: s.status,
    position: s.position ?? i,
    effort_range: s.effortRange ?? null,
    duration_minutes: s.durationMinutes ?? null,
    micro_step: s.microStep ?? null,
    notes: s.notes ?? null,
  }));
  const { error } = await supabase.from('task_steps').insert(rows);
  if (error) console.error('Failed to save task steps:', error);
}

// ─── Projects (Planning) ─────────────────────────────────────────
export async function fetchProjects(userId: string): Promise<Project[]> {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    description: r.description,
    status: r.status,
    targetDate: r.target_date,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createProject(userId: string, project: { title: string; description?: string; targetDate?: string }): Promise<Project> {
  const id = uid();
  const ts = now();
  await supabase.from('projects').insert({
    id,
    user_id: userId,
    title: project.title,
    description: project.description ?? null,
    status: 'active',
    target_date: project.targetDate ?? null,
    created_at: ts,
    updated_at: ts,
  });
  return { id, userId, title: project.title, description: project.description, status: 'active', targetDate: project.targetDate, createdAt: ts, updatedAt: ts };
}

export async function updateProject(projectId: string, updates: Partial<Pick<Project, 'title' | 'description' | 'status' | 'targetDate'>>): Promise<void> {
  const dbUpdates: Record<string, any> = { updated_at: now() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate;
  await supabase.from('projects').update(dbUpdates).eq('id', projectId);
}

export async function deleteProject(projectId: string): Promise<void> {
  await supabase.from('roadmap_nodes').delete().eq('project_id', projectId);
  await supabase.from('projects').delete().eq('id', projectId);
}

// ─── Roadmap Nodes ────────────────────────────────────────────────
export async function fetchRoadmapNodes(projectId: string): Promise<RoadmapNode[]> {
  const { data } = await supabase
    .from('roadmap_nodes')
    .select('*')
    .eq('project_id', projectId)
    .order('position');
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    outcome: r.outcome,
    whyItMatters: r.why_it_matters,
    instructions: r.instructions,
    checklist: r.checklist,
    position: r.position,
    status: r.status,
    dependencies: r.dependencies,
    suggestedTimeframe: r.suggested_timeframe,
    definitionOfDone: r.definition_of_done,
    potentialObstacles: r.potential_obstacles,
    fallbackPath: r.fallback_path,
    nextMilestoneId: r.next_milestone_id,
    createdAt: r.created_at,
  }));
}

export async function saveRoadmapNodes(projectId: string, nodes: Omit<RoadmapNode, 'id' | 'projectId' | 'createdAt'>[]): Promise<void> {
  await supabase.from('roadmap_nodes').delete().eq('project_id', projectId);
  const rows = nodes.map((n, i) => ({
    id: uid(),
    project_id: projectId,
    title: n.title,
    outcome: n.outcome ?? null,
    why_it_matters: n.whyItMatters ?? null,
    instructions: n.instructions ?? null,
    checklist: n.checklist ?? null,
    position: n.position ?? i,
    status: n.status ?? 'pending',
    dependencies: n.dependencies ?? null,
    suggested_timeframe: n.suggestedTimeframe ?? null,
    definition_of_done: n.definitionOfDone ?? null,
    potential_obstacles: n.potentialObstacles ?? null,
    fallback_path: n.fallbackPath ?? null,
    next_milestone_id: n.nextMilestoneId ?? null,
    created_at: now(),
  }));
  const { error } = await supabase.from('roadmap_nodes').insert(rows);
  if (error) console.error('Failed to save roadmap nodes:', error);
}

export async function updateRoadmapNode(nodeId: string, updates: Partial<RoadmapNode>): Promise<void> {
  const dbUpdates: Record<string, any> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.outcome !== undefined) dbUpdates.outcome = updates.outcome;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.instructions !== undefined) dbUpdates.instructions = updates.instructions;
  if (updates.position !== undefined) dbUpdates.position = updates.position;
  await supabase.from('roadmap_nodes').update(dbUpdates).eq('id', nodeId);
}

// ─── Focus Sessions ──────────────────────────────────────────────
export async function fetchRecentSessions(userId: string, limit = 10): Promise<PersistedFocusSession[]> {
  const { data } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    userId: r.user_id,
    taskId: r.task_id,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    durationSeconds: r.duration_seconds,
    status: r.status,
  }));
}

export async function createFocusSession(userId: string, taskId?: string): Promise<string> {
  const id = uid();
  await supabase.from('focus_sessions').insert({
    id,
    user_id: userId,
    task_id: taskId ?? null,
    started_at: now(),
    status: 'active',
  });
  return id;
}

export async function endFocusSession(sessionId: string, durationSeconds: number): Promise<void> {
  await supabase.from('focus_sessions').update({
    ended_at: now(),
    duration_seconds: durationSeconds,
    status: 'completed',
  }).eq('id', sessionId);
}

// ─── Daily Reflections ───────────────────────────────────────────
export async function fetchTodayReflection(userId: string): Promise<DailyReflection | null> {
  const { data } = await supabase
    .from('daily_reflections')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today())
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    completedSummary: data.completed_summary,
    difficultyNote: data.difficulty_note,
    tomorrowNote: data.tomorrow_note,
    createdAt: data.created_at,
  };
}

export async function saveReflection(userId: string, reflection: { completedSummary?: string; difficultyNote?: string; tomorrowNote?: string }): Promise<void> {
  const id = uid();
  await supabase.from('daily_reflections').upsert({
    id,
    user_id: userId,
    date: today(),
    completed_summary: reflection.completedSummary ?? null,
    difficulty_note: reflection.difficultyNote ?? null,
    tomorrow_note: reflection.tomorrowNote ?? null,
    created_at: now(),
  }, { onConflict: 'user_id,date' });
}

// ─── Activity Tracking ──────────────────────────────────────────
export async function insertActivityEvent(event: UserActivityEvent): Promise<boolean> {
  const { error } = await supabase.from('user_activity_events').insert({
    user_id: event.userId,
    session_id: event.sessionId ?? null,
    event_name: event.eventName,
    occurred_at: event.occurredAt,
    source: event.source,
    screen: event.screen ?? null,
    object_type: event.objectType ?? null,
    object_id: event.objectId ?? null,
    properties: event.properties,
    sensitivity: event.sensitivity,
    idempotency_key: event.id,
  });
  if (error) {
    console.error('Failed to insert activity event:', error);
    return false;
  }
  return true;
}

export async function fetchActivityEvents(userId: string, limit = 50): Promise<UserActivityEvent[]> {
  const { data } = await supabase
    .from('user_activity_events')
    .select('*')
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    userId: r.user_id,
    sessionId: r.session_id ?? undefined,
    eventName: r.event_name as UserActivityEvent['eventName'],
    occurredAt: r.occurred_at,
    source: r.source,
    screen: r.screen ?? undefined,
    objectType: r.object_type ?? undefined,
    objectId: r.object_id ?? undefined,
    properties: r.properties ?? {},
    sensitivity: r.sensitivity ?? 'standard',
    consentContext: {
      interactionHistory: false,
      aiPersonalization: false,
      dailyCheckInContext: false,
      conversationMemory: false,
    },
  }));
}

export async function fetchConsentStatus(userId: string): Promise<ConsentSettings | null> {
  const { data } = await supabase
    .from('activity_tracking_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  return {
    interactionHistory: data.interaction_history ?? false,
    aiPersonalization: data.ai_personalization ?? false,
    dailyCheckInContext: data.daily_check_in_context ?? false,
    conversationMemory: data.conversation_memory ?? false,
    technicalDiagnostics: data.technical_diagnostics ?? true,
    consentVersion: data.consent_version ?? '1.0',
    updatedAt: data.updated_at ?? new Date().toISOString(),
  };
}

export async function saveConsentStatus(userId: string, consent: ConsentSettings, hasConsented: boolean): Promise<void> {
  const { error } = await supabase.from('activity_tracking_preferences').upsert({
    user_id: userId,
    interaction_history: consent.interactionHistory,
    ai_personalization: consent.aiPersonalization,
    daily_check_in_context: consent.dailyCheckInContext,
    conversation_memory: consent.conversationMemory,
    technical_diagnostics: consent.technicalDiagnostics,
    consent_version: consent.consentVersion ?? '1.0',
    has_consented: hasConsented,
    updated_at: now(),
  }, { onConflict: 'user_id' });
  if (error) console.error('Failed to save consent status:', error);
}

export async function fetchPersonalizationProfile(userId: string): Promise<AIPersonalizationProfile | null> {
  const { data } = await supabase
    .from('ai_personalization_profiles')
    .select('profile')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  return data.profile as AIPersonalizationProfile;
}

export async function savePersonalizationProfile(userId: string, profile: AIPersonalizationProfile): Promise<void> {
  const { error } = await supabase.from('ai_personalization_profiles').upsert({
    user_id: userId,
    profile,
    last_updated_at: now(),
  }, { onConflict: 'user_id' });
  if (error) console.error('Failed to save personalization profile:', error);
}

export async function deleteActivityHistory(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_activity_events')
    .delete()
    .eq('user_id', userId);
  if (error) console.error('Failed to delete activity history:', error);
}

export async function resetPersonalizationProfile(userId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_personalization_profiles')
    .delete()
    .eq('user_id', userId);
  if (error) console.error('Failed to reset personalization profile:', error);
}

export async function logAIFeedback(userId: string, feedback: { suggestionType?: string; outcome: 'accepted' | 'edited' | 'dismissed' | 'rejected'; sourceEvent?: string }): Promise<void> {
  const { error } = await supabase.from('ai_interaction_feedback').insert({
    user_id: userId,
    suggestion_type: feedback.suggestionType ?? null,
    outcome: feedback.outcome,
    source_event: feedback.sourceEvent ?? null,
  });
  if (error) console.error('Failed to log AI feedback:', error);
}

export async function writeContextAudit(record: AssemblyAuditRecord): Promise<void> {
  const { error } = await supabase.from('ai_context_audit').insert({
    request_id: record.requestId,
    user_id: record.userId,
    schema_version: record.schemaVersion,
    intent: record.intent,
    consent_applied: record.consentApplied,
    categories_included: record.categoriesIncluded,
    categories_excluded: record.categoriesExcluded,
    events_considered: record.eventsConsidered,
    events_included: record.eventsIncluded,
    redactions_by_category: record.redactionsByCategory,
    estimated_tokens: record.estimatedTokens,
    outcome: record.outcome,
    failure_category: record.failureCategory ?? null,
  });
  if (error) console.error('Failed to write context audit:', error);
}
