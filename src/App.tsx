import { useAppStore } from './store/useAppStore';
import { HomeScreen } from './screens/HomeScreen';
import { BreakdownScreen } from './screens/BreakdownScreen';
import { FocusScreen } from './screens/FocusScreen';
import { ReflectionScreen } from './screens/ReflectionScreen';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const { screen } = useAppStore();

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
          {screen === 'breakdown' && <BreakdownScreen />}
          {screen === 'focus' && <FocusScreen />}
          {screen === 'reflection' && <ReflectionScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;
