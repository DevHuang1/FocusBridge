import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { TypingIndicator } from '../components/TypingIndicator';
import { AnimatedItem } from '../components/CalmMotion';
import { useToast } from '../components/Toast';
import { aiService, extractJsonArray } from '../lib/ai';
import { trackActivity } from '../lib/activity';
import {   ChevronLeft, ChevronDown, CheckCircle2, Circle, ArrowRight, Sparkles, Clock, AlertTriangle, Link as LinkIcon, Play, Pause, Check } from 'lucide-react';
import type { Project, RoadmapNode, MilestoneStatus, TaskStep } from '../types';

export function PlanningScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const { toast } = useToast();
  const projects = useAppStore((s) => s.projects);
  const setProjects = useAppStore((s) => s.setProjects);
  const milestones = useAppStore((s) => s.milestones);
  const setMilestones = useAppStore((s) => s.setMilestones);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<RoadmapNode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNewProject = async (title: string) => {
    setIsGenerating(true);
    try {
      const raw = await aiService.generateMilestones(title);
      const parsed = aiService.extractJsonArray(raw);
      const newProject: Project = { id: `proj-${Date.now()}`, userId: '', title, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const newMilestones: RoadmapNode[] = (parsed && Array.isArray(parsed) ? parsed : []).map((m: any, i: number) => ({
        id: `mn-${Date.now()}-${i}`, projectId: newProject.id, title: m.title || `Milestone ${i + 1}`, outcome: m.outcome, whyItMatters: m.whyItMatters, suggestedTimeframe: m.suggestedTimeframe, definitionOfDone: m.definitionOfDone, position: i, status: 'pending' as MilestoneStatus, createdAt: new Date().toISOString(),
      }));
      if (newMilestones.length === 0) {
        newMilestones.push(
          { id: `mn-${Date.now()}-0`, projectId: newProject.id, title: 'First milestone', position: 0, status: 'pending', createdAt: new Date().toISOString() },
          { id: `mn-${Date.now()}-1`, projectId: newProject.id, title: 'Second milestone', position: 1, status: 'pending', createdAt: new Date().toISOString() },
        );
      }
      setProjects((prev) => [...prev, newProject]);
      setMilestones(newMilestones);
      setSelectedProject(newProject);
      trackActivity('roadmap_created', { properties: { milestoneCount: newMilestones.length } });
    } catch (error) {
      console.error('Failed to generate milestones:', error);
      toast('Failed to generate roadmap — please try again', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateMilestoneStatus = (id: string, status: MilestoneStatus) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  };

  if (!selectedProject) {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-12 md:py-16">
        <div className="w-full max-w-lg">
          <button onClick={() => setScreen('dashboard')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-8 cursor-pointer">
            <ChevronLeft size={16} /> Dashboard
          </button>
          <AnimatedItem>
            <h1 className="font-serif text-3xl md:text-4xl text-text-primary mb-2">Planning</h1>
            <p className="text-text-secondary mb-8">How does this larger goal fit together?</p>
          </AnimatedItem>
          {isGenerating ? (
            <TypingIndicator label="Creating your roadmap" />
          ) : (
            <>
              <AnimatedItem index={1}>
                <TextInput onSubmit={handleNewProject} placeholder="e.g., Plan a career change, Build a portfolio site..." />
              </AnimatedItem>
              {projects.length > 0 && (
                <AnimatedItem index={2}>
                  <div className="mt-8">
                    <h2 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wide">Your projects</h2>
                    <div className="space-y-3">
                      {projects.map((project) => (
                        <Card key={project.id} padding="sm" hover onClick={() => setSelectedProject(project)}>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--color-theme-surface)' }}><LinkIcon size={14} style={{ color: 'var(--color-theme-primary)' }} /></div>
                            <div className="flex-1"><p className="text-sm font-medium text-text-primary">{project.title}</p><p className="text-xs text-text-muted">{project.status}</p></div>
                            <ArrowRight size={14} className="text-text-muted" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </AnimatedItem>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 md:py-16">
      <div className="w-full max-w-lg">
        <button onClick={() => { setSelectedProject(null); setSelectedMilestone(null); }} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-8 cursor-pointer">
          <ChevronLeft size={16} /> All projects
        </button>
        <AnimatedItem>
          <h1 className="font-serif text-3xl md:text-4xl text-text-primary mb-2">{selectedProject.title}</h1>
          <p className="text-text-secondary mb-8">Your roadmap</p>
        </AnimatedItem>

        <div className="relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-0.5" style={{ backgroundColor: 'var(--color-theme-border)' }} />
          <div className="space-y-4">
            {[...milestones].sort((a, b) => a.position - b.position).map((milestone, i) => {
              const isCompleted = milestone.status === 'completed';
              const isActive = milestone.status === 'in_progress';
              const isExpanded = selectedMilestone?.id === milestone.id;
              return (
                <AnimatedItem key={milestone.id} index={i + 1}>
                  <div className="relative flex gap-4">
                    <div className="relative z-10 shrink-0">
                      <button onClick={() => { trackActivity('roadmap_node_opened', { objectType: 'roadmap_node', objectId: milestone.id, properties: { nodeIndex: i } }); setSelectedMilestone(isExpanded ? null : milestone); }} className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border-2" style={{ backgroundColor: isCompleted ? 'var(--color-theme-primary)' : 'var(--color-cream-50)', borderColor: isCompleted || isActive ? 'var(--color-theme-primary)' : 'var(--color-theme-border)' }}>
                        {isCompleted ? <CheckCircle2 size={16} className="text-white" /> : isActive ? <Play size={14} style={{ color: 'var(--color-theme-primary)' }} /> : <Circle size={14} className="text-text-muted" />}
                      </button>
                    </div>
                    <Card padding="sm" className={`flex-1 ${isCompleted ? 'opacity-60' : ''} ${isExpanded ? 'ring-2' : ''}`} style={isExpanded ? { boxShadow: '0 0 0 2px var(--color-theme-primary)' } : undefined} hover onClick={() => setSelectedMilestone(isExpanded ? null : milestone)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{milestone.title}</p>
                          {milestone.outcome && <p className="text-xs text-text-muted mt-1">{milestone.outcome}</p>}
                          {milestone.suggestedTimeframe && <span className="inline-flex items-center gap-1 text-xs text-text-muted mt-2 bg-cream-100 px-2 py-0.5 rounded-full"><Clock size={10} />{milestone.suggestedTimeframe}</span>}
                        </div>
                        <ChevronDown size={16} className={`text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-cream-200 space-y-3">
                          {milestone.whyItMatters && <div><p className="text-xs font-medium text-text-muted mb-1">Why this matters</p><p className="text-sm text-text-secondary">{milestone.whyItMatters}</p></div>}
                          {milestone.definitionOfDone && <div><p className="text-xs font-medium text-text-muted mb-1">Definition of done</p><p className="text-sm text-text-secondary">{milestone.definitionOfDone}</p></div>}
                          {milestone.potentialObstacles && <div><p className="text-xs font-medium text-text-muted mb-1 flex items-center gap-1"><AlertTriangle size={10} />Potential obstacles</p><p className="text-sm text-text-secondary">{milestone.potentialObstacles}</p></div>}
                          {milestone.fallbackPath && <div><p className="text-xs font-medium text-text-muted mb-1">Fallback path</p><p className="text-sm text-text-secondary">{milestone.fallbackPath}</p></div>}
                          <div className="flex gap-2 flex-wrap pt-2">
                            {milestone.status !== 'completed' && <Button size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); updateMilestoneStatus(milestone.id, 'completed'); }}><Check size={14} />Complete</Button>}
                            {milestone.status !== 'in_progress' && milestone.status !== 'completed' && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); updateMilestoneStatus(milestone.id, 'in_progress'); }}><Play size={14} />Start</Button>}
                            {milestone.status !== 'paused' && milestone.status !== 'completed' && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); updateMilestoneStatus(milestone.id, 'paused'); }}><Pause size={14} />Pause</Button>}
                          </div>
                          <Button size="sm" className="w-full mt-2" onClick={async (e) => {
                            e.stopPropagation();
                            trackActivity('roadmap_node_converted_to_task', { objectType: 'roadmap_node', objectId: milestone.id, properties: { nodeIndex: i } });
                            try {
                              const raw = await aiService.generateTasksFromMilestone(milestone.title, milestone.outcome || '');
                              const parsed = extractJsonArray(raw);
                              const steps: TaskStep[] = (parsed && Array.isArray(parsed) ? parsed : []).map((t: any, j: number) => ({
                                id: `step-${Date.now()}-${j}`,
                                title: t.title || `Task ${j + 1}`,
                                durationMinutes: Math.min(10, Math.max(1, t.durationMinutes || 5)),
                                status: 'pending' as const,
                              }));
                              if (steps.length > 0) {
                                useAppStore.setState({
                                  currentSession: {
                                    id: `session-${Date.now()}`,
                                    goalTitle: milestone.title,
                                    steps,
                                    groups: [{ label: 'From milestone', emoji: '📋', steps }],
                                    currentStepIndex: 0,
                                    feedback: [],
                                    startedAt: new Date().toISOString(),
                                    distractions: [],
                                  },
                                  sessionSteps: steps,
                                  screen: 'work_tasks',
                                });
                              } else {
                                setScreen('work_tasks');
                              }
                            } catch {
                              setScreen('work_tasks');
                            }
                          }}><Sparkles size={14} />Convert to work tasks</Button>
                        </div>
                      )}
                    </Card>
                  </div>
                </AnimatedItem>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
