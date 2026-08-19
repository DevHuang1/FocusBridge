import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function AuthScreen() {
  const { signIn, signUp, signInAsDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleDemo = async () => {
    setError(null);
    setDemoLoading(true);
    const result = await signInAsDemo();
    if (result.error) {
      setError(result.error);
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);

    const fn = mode === 'signin' ? signIn : signUp;
    const result = await fn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (mode === 'signup') {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <div className="text-4xl mb-4">📧</div>
          <h1 className="font-serif text-2xl text-text-primary mb-2">Check your email</h1>
          <p className="text-text-secondary mb-6">We sent a confirmation link to <strong>{email}</strong></p>
          <Button onClick={() => { setMode('signin'); setSent(false); }} className="w-full" variant="secondary">Back to sign in</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/logo/logo-96.png" alt="Focus Bridge" className="w-16 h-16 mx-auto mb-4" />
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: 'var(--color-theme-surface)', color: 'var(--color-theme-primary)' }}>
            FocusBridge
          </div>
          <h1 className="font-serif text-3xl text-text-primary mb-2">
            {mode === 'signin' ? 'Welcome back' : 'Get started'}
          </h1>
          <p className="text-text-secondary">
            {mode === 'signin' ? 'Sign in to continue your progress' : 'Create an account to save your data'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-cream-200 bg-surface text-text-primary focus:outline-none transition-colors focus:border-[var(--color-theme-primary)]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-2xl border-2 border-cream-200 bg-surface text-text-primary focus:outline-none transition-colors focus:border-[var(--color-theme-primary)]"
            />
          </div>

          {error && <p className="text-sm text-warm-500 bg-warm-50 p-3 rounded-xl">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }} className="text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer">
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cream-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-surface px-3 text-text-muted">or</span></div>
          </div>
          <Button variant="ghost" onClick={handleDemo} className="w-full" disabled={demoLoading}>
            {demoLoading ? 'Signing in...' : 'Try the demo account'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
