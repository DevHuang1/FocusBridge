import { useAppStore } from './store/useAppStore';
import { HomeScreen } from './screens/HomeScreen';
import { BreakdownScreen } from './screens/BreakdownScreen';
import { FocusScreen } from './screens/FocusScreen';
import { ReflectionScreen } from './screens/ReflectionScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { MoodScreen } from './screens/MoodScreen';
import { AuthScreen } from './screens/AuthScreen';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppShell() {
  const { screen } = useAppStore();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sage-300 border-t-sage-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && screen !== 'auth') {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {screen === 'home' && <HomeScreen />}
          {screen === 'mood' && <MoodScreen />}
          {screen === 'breakdown' && <BreakdownScreen />}
          {screen === 'focus' && <FocusScreen />}
          {screen === 'reflection' && <ReflectionScreen />}
          {screen === 'dashboard' && <DashboardScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
