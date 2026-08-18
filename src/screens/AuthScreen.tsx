import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useState } from 'react';
import { Mail, ArrowRight, Leaf } from 'lucide-react';

export function AuthScreen() {
  const { signInWithGoogle, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMagicLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await signInWithMagicLink(email.trim());
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-14 h-14 bg-sage-100 rounded-3xl mb-5"
          >
            <Leaf size={24} className="text-sage-500" />
          </motion.div>
          <h1 className="font-serif text-3xl text-text-primary mb-2">Focus Bridge</h1>
          <p className="text-text-secondary text-sm">
            Save your progress across devices.
          </p>
        </div>

        <Card>
          <div className="space-y-4">
            <Button
              onClick={signInWithGoogle}
              className="w-full"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cream-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-3 text-text-muted">or</span>
              </div>
            </div>

            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail size={18} className="text-sage-500" />
                </div>
                <p className="text-sm font-medium text-text-primary mb-1">Check your inbox</p>
                <p className="text-xs text-text-muted">We sent a login link to {email}</p>
              </motion.div>
            ) : (
              <>
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Email address</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
                      placeholder="you@example.com"
                      className="flex-1 px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-sage-400 transition-colors"
                    />
                    <Button
                      onClick={handleMagicLink}
                      disabled={!email.trim() || loading}
                      size="sm"
                    >
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                  {error && (
                    <p className="text-xs text-red-500 mt-1.5">{error}</p>
                  )}
                </div>
                <p className="text-xs text-text-muted text-center">
                  We'll send you a magic link — no password needed.
                </p>
              </>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
