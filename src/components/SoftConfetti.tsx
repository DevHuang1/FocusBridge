

interface SoftConfettiProps {
  active: boolean;
}

export function SoftConfetti({ active }: SoftConfettiProps) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-fade-in"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: ['var(--color-theme-primary)', 'var(--color-warm-300)', 'var(--color-sage-300)'][i % 3],
            opacity: 0.4,
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}
