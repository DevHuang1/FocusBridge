import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { usePersonalizationStore } from './store/usePersonalizationStore';
import { useConsentStore } from './store/useConsentStore';
import { trackActivity } from './lib/activity';
import { ensureConsentSynced } from './lib/context';
import { CheckInFlow } from './components/CheckInFlow';
import { HomeScreen } from './screens/HomeScreen';
import { BreakdownScreen } from './screens/BreakdownScreen';
import { FocusScreen } from './screens/FocusScreen';
import { ReflectionScreen } from './screens/ReflectionScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { MoodScreen } from './screens/MoodScreen';
import { AuthScreen } from './screens/AuthScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { WorkTasksScreen } from './screens/WorkTasksScreen';
import { PlanningScreen } from './screens/PlanningScreen';
import { LandingPage } from './pages/LandingPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppShell() {
  const screen = useAppStore((s) => s.screen);
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const applyThemeToDOM = usePersonalizationStore((s) => s.applyThemeToDOM);
  const hasConsented = useConsentStore((s) => s.hasConsented);
  const consentDismissed = useConsentStore((s) => s.consentDismissed);
  const pendingCheckIn = usePersonalizationStore((s) => s.pendingCheckIn);
  const todayCheckIn = usePersonalizationStore((s) => s.todayCheckIn);
  const setPendingCheckIn = usePersonalizationStore((s) => s.setPendingCheckIn);
  const setTodayCheckIn = usePersonalizationStore((s) => s.setTodayCheckIn);

  useEffect(() => {
    applyThemeToDOM();
  }, []);

  useEffect(() => {
    if (user) void ensureConsentSynced();
  }, [user]);

  useEffect(() => {
    if (hasConsented || consentDismissed) {
      trackActivity('screen_viewed', { properties: { screen } });
    }
  }, [screen, hasConsented, consentDismissed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cream-300 rounded-full animate-spin" style={{ borderTopColor: 'var(--color-theme-primary)' }} />
      </div>
    );
  }

  if (!user && screen !== 'auth') {
    return <AuthScreen />;
  }

  // Ask how the user is arriving right after signing in, unless they
  // already completed or skipped today's check-in.
  if (user && pendingCheckIn && !todayCheckIn) {
    return (
      <CheckInFlow
        onComplete={(checkIn) => {
          setTodayCheckIn(checkIn);
          setPendingCheckIn(false);
        }}
        onSkip={() => setPendingCheckIn(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {screen === 'home' && <HomeScreen />}
      {screen === 'mood' && <MoodScreen />}
      {screen === 'breakdown' && <BreakdownScreen />}
      {screen === 'focus' && <FocusScreen />}
      {screen === 'reflection' && <ReflectionScreen />}
      {screen === 'dashboard' && <DashboardScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'work_tasks' && <WorkTasksScreen />}
      {screen === 'planning' && <PlanningScreen />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/app/*" element={<AppShell />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
