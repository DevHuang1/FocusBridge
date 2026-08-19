interface TypingIndicatorProps {
  label?: string;
}

export function TypingIndicator({ label = 'Thinking' }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-cream-50 rounded-2xl border border-cream-100">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full animate-pulse-soft"
            style={{
              backgroundColor: 'var(--color-theme-primary)',
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>
      <span className="text-sm text-text-muted">{label}...</span>
    </div>
  );
}
