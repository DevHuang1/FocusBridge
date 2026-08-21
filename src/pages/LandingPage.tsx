import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Timer, Heart, Shield, ArrowRight, Zap, Moon, Brain } from 'lucide-react';

const features = [
  {
    icon: <Sparkles size={24} />,
    title: 'AI Task Breakdown',
    desc: 'Type a vague goal and get 3-5 tiny, concrete steps you can start right now.',
  },
  {
    icon: <Timer size={24} />,
    title: 'Focus Sessions',
    desc: 'Gentle countdown timer with "I\'m stuck" support and real-time adaptation.',
  },
  {
    icon: <Brain size={24} />,
    title: 'Drill Down',
    desc: 'Break any step into even smaller sub-steps. Up to 2 levels deep.',
  },
  {
    icon: <Heart size={24} />,
    title: 'Calm & Compassionate',
    desc: 'No shame, no guilt, no streaks. Just gentle support for how your brain works.',
  },
  {
    icon: <Shield size={24} />,
    title: 'Privacy First',
    desc: 'Granular consent controls. You decide what\'s tracked. Export or delete anytime.',
  },
  {
    icon: <Moon size={24} />,
    title: 'Accessible Design',
    desc: '6 color themes, reduced motion support, and ADHD-friendly by default.',
  },
];

const steps = [
  { num: '1', text: 'Tell FocusBridge what you need to do' },
  { num: '2', text: 'AI breaks it into tiny, doable steps' },
  { num: '3', text: 'Start a focus session on one step' },
  { num: '4', text: 'Get unstuck, adapt, and finish' },
];

export function LandingPage() {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user) navigate('/app', { replace: true });
  }, [user]);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{ backgroundColor: scrollY > 20 ? 'rgba(253,252,250,0.92)' : 'transparent', backdropFilter: scrollY > 20 ? 'blur(12px)' : 'none' }}>
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/focus_bridge.png" alt="" className="w-7 h-7 object-contain" />
            <span className="text-base font-semibold tracking-tight text-text-primary">FocusBridge</span>
          </div>
          <Button size="sm" onClick={() => navigate('/app')}>
            Open App <ArrowRight size={14} />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <img src="/focus_bridge.png" alt="FocusBridge" className="w-20 h-20 object-contain mx-auto mb-8 animate-fade-in" />
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-text-primary mb-6 leading-tight animate-fade-in-up">
            Overwhelm meets its<br />
            <span style={{ color: 'var(--color-theme-primary)' }}>gentle opposite.</span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            FocusBridge turns vague, intimidating goals into tiny, physical actions you can start right now. No guilt. No pressure. Just your next small step.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <Button size="lg" onClick={() => navigate('/app')}>
              Try it free <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              See how it works
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl text-text-primary mb-3">From overwhelm to action</h2>
            <p className="text-text-secondary text-lg">Four steps. That's it.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-cream-200/60 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-semibold text-sm" style={{ backgroundColor: 'var(--color-theme-primary)' }}>
                  {step.num}
                </div>
                <p className="text-text-primary font-medium pt-2">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl text-text-primary mb-3">Everything you need. Nothing you don't.</h2>
            <p className="text-text-secondary text-lg max-w-lg mx-auto">Designed with ADHD-friendly principles. Works for everyone.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Card key={f.title} padding="md" className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--color-theme-surface)', color: 'var(--color-theme-primary)' }}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI personalization callout */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <Card className="text-center p-10 md:p-14">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--color-theme-surface)' }}>
              <Zap size={28} style={{ color: 'var(--color-theme-primary)' }} />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-text-primary mb-4">AI that learns you</h2>
            <p className="text-text-secondary text-base max-w-lg mx-auto mb-8 leading-relaxed">
              FocusBridge adapts to your pace. It remembers your preferred task duration, suggests gentler steps when you're struggling, and builds a personalization profile over time — with your explicit consent.
            </p>
            <Button size="lg" onClick={() => navigate('/app')}>
              Start your first session <ArrowRight size={18} />
            </Button>
          </Card>
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-text-muted uppercase tracking-widest mb-6">Built with</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['React', 'TypeScript', 'Tailwind CSS', 'Zustand', 'Firebase', 'OpenAI API', 'Vite'].map((t) => (
              <span key={t} className="px-4 py-2 rounded-full bg-cream-100 text-sm text-text-secondary font-medium">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-5 border-t border-cream-200/60">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/focus_bridge.png" alt="" className="w-5 h-5 object-contain" />
            <span className="text-sm font-semibold text-text-secondary">FocusBridge</span>
          </div>
          <p className="text-xs text-text-muted">Pixel Forge AI Hackathon 2026</p>
        </div>
      </footer>
    </div>
  );
}
