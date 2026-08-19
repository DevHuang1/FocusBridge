import { type ReactNode, type ErrorInfo } from 'react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FocusBridge error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="text-4xl mb-4">🌿</div>
            <h1 className="font-serif text-2xl text-text-primary mb-2">
              {this.props.fallbackTitle || 'Something went wrong'}
            </h1>
            <p className="text-text-secondary mb-6">
              FocusBridge hit an unexpected issue. Your data is safe — you can try again or start fresh.
            </p>
            <div className="space-y-3">
              <Button onClick={() => this.setState({ hasError: false, error: null })} className="w-full">
                Try again
              </Button>
              <Button variant="ghost" onClick={() => { window.location.href = '/'; }} className="w-full">
                Start fresh
              </Button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-text-muted cursor-pointer">Technical details</summary>
                <pre className="mt-2 text-xs text-text-muted bg-cream-100 p-3 rounded-xl overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── React import needed for class component ─────────────────────
import React from 'react';
