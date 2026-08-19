import { usePersonalizationStore } from '../store/usePersonalizationStore';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/Toast';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AnimatedItem } from '../components/CalmMotion';
import { PrivacySettings } from '../components/PrivacySettings';
import { ChevronLeft, Palette, Zap, Layout, MessageSquare, Sparkles, Monitor, RotateCcw, Check, DoorOpen, ArrowLeftRight } from 'lucide-react';
import type { AnimationIntensity, ColorTheme, InterfaceDensity, GuidanceStyle, CelebrationLevel, ReducedMotionPref, AIAdaptation } from '../types';

const colorThemeOptions: { value: ColorTheme; label: string; preview: string }[] = [
  { value: 'sage', label: 'Sage', preview: '#5C8A5C' },
  { value: 'mist', label: 'Mist', preview: '#6B8FA3' },
  { value: 'lavender', label: 'Lavender', preview: '#8B7DA8' },
  { value: 'sky', label: 'Sky', preview: '#5B93B5' },
  { value: 'sand', label: 'Sand', preview: '#B5956B' },
  { value: 'rose', label: 'Rose', preview: '#B57A8A' },
];

const animationOptions: { value: AnimationIntensity; label: string; desc: string }[] = [
  { value: 'still', label: 'Still', desc: 'No animation' },
  { value: 'soft', label: 'Soft', desc: 'Gentle fades' },
  { value: 'balanced', label: 'Balanced', desc: 'Normal transitions' },
  { value: 'energizing', label: 'Energizing', desc: 'More dynamic' },
];

const densityOptions: { value: InterfaceDensity; label: string; desc: string }[] = [
  { value: 'minimal', label: 'Minimal', desc: 'More breathing room' },
  { value: 'comfortable', label: 'Comfortable', desc: 'Default spacing' },
  { value: 'detailed', label: 'Detailed', desc: 'More information shown' },
];

const guidanceOptions: { value: GuidanceStyle; label: string; desc: string }[] = [
  { value: 'next_step', label: 'Next step', desc: 'Just one action at a time' },
  { value: 'brief', label: 'Brief', desc: 'Action + short context' },
  { value: 'detailed', label: 'Detailed', desc: 'Full instructions' },
];

const celebrationOptions: { value: CelebrationLevel; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'full', label: 'Full' },
];

const reducedMotionOptions: { value: ReducedMotionPref; label: string }[] = [
  { value: 'follow_system', label: 'Follow system' },
  { value: 'always_on', label: 'Always on' },
  { value: 'always_off', label: 'Always off' },
];

const aiAdaptOptions: { value: AIAdaptation; label: string; desc: string }[] = [
  { value: 'off', label: 'Off', desc: 'No AI changes to interface' },
  { value: 'suggestions_only', label: 'Suggestions only', desc: 'AI recommends, you decide' },
  { value: 'auto_adapt', label: 'Auto adapt', desc: 'AI adjusts within limits' },
];

function ToggleButton({ active, onClick, label, desc }: { active: boolean; onClick: () => void; label: string; desc?: string }) {
  return (
    <button onClick={onClick} className={`w-full p-3.5 rounded-[1.25rem] border-2 text-left transition-all cursor-pointer ${active ? 'shadow-sm' : 'border-cream-200/70 hover:border-cream-300'}`} style={active ? { borderColor: 'var(--color-theme-primary)', backgroundColor: 'var(--color-theme-surface)' } : undefined}>
      <p className="text-sm font-medium text-text-primary">{label}</p>
      {desc && <p className="text-xs text-text-muted mt-0.5">{desc}</p>}
    </button>
  );
}

export function SettingsScreen() {
  const animationIntensity = usePersonalizationStore((s) => s.preferences.animationIntensity);
  const colorTheme = usePersonalizationStore((s) => s.preferences.colorTheme);
  const density = usePersonalizationStore((s) => s.preferences.density);
  const guidanceStyle = usePersonalizationStore((s) => s.preferences.guidanceStyle);
  const celebrationEffects = usePersonalizationStore((s) => s.preferences.celebrationEffects);
  const reducedMotion = usePersonalizationStore((s) => s.preferences.reducedMotion);
  const aiAdaptation = usePersonalizationStore((s) => s.preferences.aiAdaptation);
  const softStartEnabled = usePersonalizationStore((s) => s.preferences.softStartEnabled);
  const transitionBridgeEnabled = usePersonalizationStore((s) => s.preferences.transitionBridgeEnabled);
  const setAnimationIntensity = usePersonalizationStore((s) => s.setAnimationIntensity);
  const setColorTheme = usePersonalizationStore((s) => s.setColorTheme);
  const setDensity = usePersonalizationStore((s) => s.setDensity);
  const setGuidanceStyle = usePersonalizationStore((s) => s.setGuidanceStyle);
  const setCelebrationEffects = usePersonalizationStore((s) => s.setCelebrationEffects);
  const setReducedMotion = usePersonalizationStore((s) => s.setReducedMotion);
  const setAIAdaptation = usePersonalizationStore((s) => s.setAIAdaptation);
  const setSoftStartEnabled = usePersonalizationStore((s) => s.setSoftStartEnabled);
  const setTransitionBridgeEnabled = usePersonalizationStore((s) => s.setTransitionBridgeEnabled);
  const resetPreferences = usePersonalizationStore((s) => s.resetPreferences);
  const applyThemeToDOM = usePersonalizationStore((s) => s.applyThemeToDOM);
  const setScreen = useAppStore((s) => s.setScreen);
  const { toast } = useToast();

  const handleSave = () => {
    applyThemeToDOM();
    toast('Settings saved', 'success');
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-5 py-8 md:py-12">
      <div className="w-full max-w-4xl">
        <button onClick={() => setScreen('dashboard')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-8 cursor-pointer">
          <ChevronLeft size={16} /> Back to dashboard
        </button>

        <AnimatedItem>
          <div className="mb-10 flex items-center gap-4">
            <img src="/logo/logo-96.png" alt="Focus Bridge" className="w-14 h-14 rounded-2xl" />
            <div>
              <h1 className="font-serif text-3xl text-text-primary mb-2">Personalize FocusBridge</h1>
              <p className="text-text-secondary text-base">Make it feel like yours. Change anything anytime.</p>
            </div>
          </div>
        </AnimatedItem>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatedItem index={1}>
            <Card className="h-full">
              <div className="flex items-center gap-2.5 mb-5"><Palette size={18} style={{ color: 'var(--color-theme-primary)' }} /><h2 className="font-medium text-text-primary">Color theme</h2></div>
              <div className="grid grid-cols-3 gap-3">
                {colorThemeOptions.map((opt) => (
                  <button key={opt.value} onClick={() => { setColorTheme(opt.value); applyThemeToDOM(); }} className={`flex flex-col items-center gap-2.5 p-4 rounded-[1.25rem] border-2 transition-all cursor-pointer ${colorTheme === opt.value ? 'shadow-sm' : 'border-cream-200/70 hover:border-cream-300'}`} style={colorTheme === opt.value ? { borderColor: opt.preview, backgroundColor: `${opt.preview}10` } : undefined}>
                    <div className="w-9 h-9 rounded-full shadow-sm" style={{ backgroundColor: opt.preview }} />
                    <span className="text-xs font-medium text-text-primary">{opt.label}</span>
                    {colorTheme === opt.value && <Check size={12} style={{ color: opt.preview }} />}
                  </button>
                ))}
              </div>
            </Card>
          </AnimatedItem>

          <AnimatedItem index={2}>
            <Card className="h-full">
              <div className="flex items-center gap-2.5 mb-5"><Zap size={18} style={{ color: 'var(--color-theme-primary)' }} /><h2 className="font-medium text-text-primary">Animation</h2></div>
              <div className="grid grid-cols-2 gap-2.5">
                {animationOptions.map((opt) => <ToggleButton key={opt.value} active={animationIntensity === opt.value} onClick={() => setAnimationIntensity(opt.value)} label={opt.label} desc={opt.desc} />)}
              </div>
            </Card>
          </AnimatedItem>

          <AnimatedItem index={3}>
            <Card className="h-full">
              <div className="flex items-center gap-2.5 mb-5"><Layout size={18} style={{ color: 'var(--color-theme-primary)' }} /><h2 className="font-medium text-text-primary">Interface density</h2></div>
              <div className="grid grid-cols-3 gap-2.5">
                {densityOptions.map((opt) => <ToggleButton key={opt.value} active={density === opt.value} onClick={() => setDensity(opt.value)} label={opt.label} desc={opt.desc} />)}
              </div>
            </Card>
          </AnimatedItem>

          <AnimatedItem index={4}>
            <Card className="h-full">
              <div className="flex items-center gap-2.5 mb-5"><MessageSquare size={18} style={{ color: 'var(--color-theme-primary)' }} /><h2 className="font-medium text-text-primary">Task guidance</h2></div>
              <div className="grid grid-cols-3 gap-2.5">
                {guidanceOptions.map((opt) => <ToggleButton key={opt.value} active={guidanceStyle === opt.value} onClick={() => setGuidanceStyle(opt.value)} label={opt.label} desc={opt.desc} />)}
              </div>
            </Card>
          </AnimatedItem>

          <AnimatedItem index={5}>
            <Card className="h-full">
              <div className="flex items-center gap-2.5 mb-5"><Sparkles size={18} style={{ color: 'var(--color-theme-primary)' }} /><h2 className="font-medium text-text-primary">Celebration effects</h2></div>
              <div className="flex gap-2.5">
                {celebrationOptions.map((opt) => <button key={opt.value} onClick={() => setCelebrationEffects(opt.value)} className={`flex-1 p-3.5 rounded-[1.25rem] border-2 text-center transition-all cursor-pointer ${celebrationEffects === opt.value ? 'shadow-sm' : 'border-cream-200/70 hover:border-cream-300'}`} style={celebrationEffects === opt.value ? { borderColor: 'var(--color-theme-primary)', backgroundColor: 'var(--color-theme-surface)' } : undefined}><span className="text-sm font-medium text-text-primary">{opt.label}</span></button>)}
              </div>
            </Card>
          </AnimatedItem>

          <AnimatedItem index={6}>
            <Card className="h-full">
              <div className="flex items-center gap-2.5 mb-5"><Monitor size={18} style={{ color: 'var(--color-theme-primary)' }} /><h2 className="font-medium text-text-primary">Reduced motion</h2></div>
              <div className="flex gap-2.5">
                {reducedMotionOptions.map((opt) => <button key={opt.value} onClick={() => setReducedMotion(opt.value)} className={`flex-1 p-3.5 rounded-[1.25rem] border-2 text-center transition-all cursor-pointer ${reducedMotion === opt.value ? 'shadow-sm' : 'border-cream-200/70 hover:border-cream-300'}`} style={reducedMotion === opt.value ? { borderColor: 'var(--color-theme-primary)', backgroundColor: 'var(--color-theme-surface)' } : undefined}><span className="text-sm font-medium text-text-primary">{opt.label}</span></button>)}
              </div>
            </Card>
          </AnimatedItem>

          <AnimatedItem index={7}>
            <Card className="h-full">
              <div className="flex items-center gap-2.5 mb-5"><Sparkles size={18} style={{ color: 'var(--color-theme-primary)' }} /><h2 className="font-medium text-text-primary">AI adaptation</h2></div>
              <div className="space-y-2.5">
                {aiAdaptOptions.map((opt) => <ToggleButton key={opt.value} active={aiAdaptation === opt.value} onClick={() => setAIAdaptation(opt.value)} label={opt.label} desc={opt.desc} />)}
              </div>
            </Card>
          </AnimatedItem>

          <AnimatedItem index={8}>
            <Card className="h-full">
              <div className="flex items-center gap-2.5 mb-5"><DoorOpen size={18} style={{ color: 'var(--color-theme-primary)' }} /><h2 className="font-medium text-text-primary">Starting gently</h2></div>
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-[1.25rem] border-2 border-cream-200/70">
                <div>
                  <p className="text-sm font-medium text-text-primary">Soft-start ritual</p>
                  <p className="text-xs text-text-muted">Ask for one tiny first move (2 or 5 min) before the full timer</p>
                </div>
                <button
                  onClick={() => setSoftStartEnabled(!softStartEnabled)}
                  role="switch"
                  aria-checked={softStartEnabled}
                  className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer shrink-0 ${softStartEnabled ? 'bg-sage-500' : 'bg-cream-300'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${softStartEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </Card>
          </AnimatedItem>

          <AnimatedItem index={9}>
            <Card className="h-full">
              <div className="flex items-center gap-2.5 mb-5"><ArrowLeftRight size={18} style={{ color: 'var(--color-theme-primary)' }} /><h2 className="font-medium text-text-primary">Transitions</h2></div>
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-[1.25rem] border-2 border-cream-200/70">
                <div>
                  <p className="text-sm font-medium text-text-primary">Transition bridge</p>
                  <p className="text-xs text-text-muted">Quiet prep before a session and a clear choice after it</p>
                </div>
                <button
                  onClick={() => setTransitionBridgeEnabled(!transitionBridgeEnabled)}
                  role="switch"
                  aria-checked={transitionBridgeEnabled}
                  className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer shrink-0 ${transitionBridgeEnabled ? 'bg-sage-500' : 'bg-cream-300'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${transitionBridgeEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </Card>
          </AnimatedItem>

          <AnimatedItem index={10} className="md:col-span-2">
            <PrivacySettings />
          </AnimatedItem>

          <AnimatedItem index={11} className="md:col-span-2">
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} className="flex-1" size="lg">
                <Check size={18} /> Apply changes
              </Button>
              <Button variant="ghost" onClick={() => { resetPreferences(); toast('Settings reset to defaults', 'info'); }}>
                <RotateCcw size={16} /> Reset
              </Button>
            </div>
          </AnimatedItem>
        </div>
      </div>
    </div>
  );
}
