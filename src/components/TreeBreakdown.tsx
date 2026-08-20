import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { TaskStep } from '../types';
import { useAppStore } from '../store/useAppStore';
import { usePersonalizationStore } from '../store/usePersonalizationStore';
import { Clock, ChevronDown, Loader2, GitBranchPlus, Check, Trash2 } from 'lucide-react';

const T_ROAD = 300;
const T_DOT = 180;
const T_CARD = 300;
const T_STEP = T_ROAD + T_DOT + T_CARD + 50;

const DESKTOP_OFFSET = 60;
const MOBILE_OFFSET = 32;
const MAX_DEPTH = 2;

function getZigZagX(index: number, offset: number): number {
  if (index === 0) return 0;
  const sign = index % 2 === 0 ? -1 : 1;
  return sign * (offset + (index % 3) * 8);
}

function countAll(steps: TaskStep[]): number {
  let n = 0;
  for (const s of steps) {
    n++;
    if (s.children) n += countAll(s.children);
  }
  return n;
}

function countDone(steps: TaskStep[]): number {
  let n = 0;
  for (const s of steps) {
    if (s.status === 'completed') n++;
    if (s.children) n += countDone(s.children);
  }
  return n;
}

interface TreeBreakdownProps {
  goalTitle: string;
  steps: TaskStep[];
}

export function TreeBreakdown({ goalTitle, steps }: TreeBreakdownProps) {
  const [mounted, setMounted] = useState(false);
  const [positions, setPositions] = useState<{ cx: number; top: number; bottom: number }[]>([]);
  const [pathLengths, setPathLengths] = useState<number[]>([]);
  const [animIndex, setAnimIndex] = useState(-1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [zigZagOffset, setZigZagOffset] = useState(DESKTOP_OFFSET);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  const intensity = usePersonalizationStore((s) => s.preferences.animationIntensity);
  const reducedMotion = usePersonalizationStore((s) => s.preferences.reducedMotion);
  const isReduced =
    reducedMotion === 'always_on' ||
    (reducedMotion === 'follow_system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const skip = intensity === 'still' || isReduced;

  useEffect(() => {
    const update = () => setZigZagOffset(window.innerWidth < 640 ? MOBILE_OFFSET : DESKTOP_OFFSET);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const totalSteps = useMemo(() => countAll(steps), [steps]);
  const completedSteps = useMemo(() => countDone(steps), [steps]);
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const nextPendingIndex = steps.findIndex((s) => s.status === 'pending');

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const measure = useCallback(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    const wr = wrap.getBoundingClientRect();
    const pos = cardRefs.current
      .map((el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          cx: r.left + r.width / 2 - wr.left,
          top: r.top - wr.top,
          bottom: r.bottom - wr.top,
        };
      })
      .filter(Boolean) as { cx: number; top: number; bottom: number }[];
    setPositions(pos);
    const lens = pathRefs.current.map((p) => p?.getTotalLength() ?? 0);
    setPathLengths(lens);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMounted(true);
      measure();
    });
    return () => cancelAnimationFrame(id);
  }, [measure]);

  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => measure());
    return () => cancelAnimationFrame(id);
  }, [expandedIds, mounted, measure]);

  useEffect(() => {
    if (skip || !mounted) return;
    // Reveal the tree quickly regardless of size: cap the whole stagger to
    // ~1.5s so large trees animate fast (and don't sit invisible at
    // opacity-0 for many seconds).
    const stepDelay = steps.length > 8 ? Math.max(60, Math.floor(1500 / steps.length)) : T_STEP;
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;
    let raf: number;
    function tick() {
      if (idx > steps.length) return;
      setAnimIndex(idx);
      timer = setTimeout(() => {
        idx++;
        raf = requestAnimationFrame(tick);
      }, stepDelay);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [mounted, steps.length, skip]);

  const roadPaths = useMemo(() => {
    const paths: { d: string; key: string; isCompleted: boolean; stepIndex: number }[] = [];
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const cur = positions[i];
      if (!prev || !cur) continue;
      const sx = prev.cx;
      const sy = prev.bottom;
      const ex = cur.cx;
      const ey = cur.top;
      const dy = ey - sy;
      const wind = i % 2 === 0 ? 1 : -1;
      const amp = Math.min(45, Math.abs(dy) * 0.35);
      const d = `M ${sx} ${sy} C ${sx + amp * wind} ${sy + dy * 0.45}, ${ex - amp * wind} ${ey - dy * 0.45}, ${ex} ${ey}`;
      paths.push({ d, key: `road-${i}`, isCompleted: steps[i]?.status === 'completed', stepIndex: i });
    }
    return paths;
  }, [positions, steps]);

  useEffect(() => {
    if (!mounted || roadPaths.length === 0) return;
    const id = requestAnimationFrame(() => {
      const lens = pathRefs.current.map((p) => p?.getTotalLength() ?? 0);
      setPathLengths(lens);
    });
    return () => cancelAnimationFrame(id);
  }, [mounted, roadPaths]);

  const isAnyExpanded = expandedIds.size > 0;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg mx-auto">
      {!skip && mounted && totalSteps > 0 && (
        <div className="mb-6 px-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Progress
            </span>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--color-theme-primary)' }}>
              {completedSteps}/{totalSteps}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-cream-200, #F0EDE5)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, backgroundColor: 'var(--color-theme-primary)' }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-center mb-10">
        <div
          className={`rounded-2xl px-6 py-3 text-center shadow-sm ${skip ? '' : mounted ? 'animate-pop-in' : 'opacity-0'}`}
          style={{ backgroundColor: 'var(--color-theme-primary)', color: 'white' }}
        >
          <p className="font-serif text-base leading-snug">{goalTitle}</p>
        </div>
      </div>

      {!skip && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
          <defs>
            <filter id="road-glow" x="-30%" y="-10%" width="160%" height="120%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>
          {roadPaths.map((rp, pathIdx) => {
            const drawn = animIndex >= rp.stepIndex;
            const drawing = animIndex === rp.stepIndex;
            const len = pathLengths[pathIdx] || 0;
            return (
              <g key={rp.key}>
                <path
                  ref={(el) => { pathRefs.current[pathIdx] = el; }}
                  d={rp.d}
                  fill="none"
                  stroke="var(--color-theme-primary)"
                  strokeWidth={drawing ? 8 : 4}
                  strokeLinecap="round"
                  filter="url(#road-glow)"
                  style={{
                    strokeDasharray: len,
                    strokeDashoffset: drawn ? 0 : len,
                    opacity: rp.isCompleted ? 0.15 : drawing ? 0.22 : drawn ? 0.08 : 0,
                    transition: drawing
                      ? `stroke-dashoffset ${T_ROAD}ms cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease`
                      : 'opacity 0.5s ease',
                  }}
                />
                <path
                  d={rp.d}
                  fill="none"
                  stroke={rp.isCompleted ? 'var(--color-theme-primary)' : drawing ? 'var(--color-theme-primary)' : 'var(--color-theme-border)'}
                  strokeWidth={rp.isCompleted ? 2 : drawing ? 2 : 1.5}
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: len,
                    strokeDashoffset: drawn ? 0 : len,
                    opacity: rp.isCompleted ? 0.5 : drawing ? 0.65 : drawn ? 0.3 : 0,
                    transition: drawing
                      ? `stroke-dashoffset ${T_ROAD}ms cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease, opacity 0.3s ease`
                      : 'stroke 0.5s ease, opacity 0.5s ease',
                  }}
                />
              </g>
            );
          })}
        </svg>
      )}

      <div className="relative z-10 flex flex-col items-center">
        {steps.map((step, i) => (
          <RoadmapStep
            key={step.id}
            step={step}
            depth={0}
            index={i}
            globalIndex={i}
            animIndex={animIndex}
            skip={skip}
            isNextPending={i === nextPendingIndex}
            expandedIds={expandedIds}
            isDimmed={isAnyExpanded && !expandedIds.has(step.id) && step.status !== 'completed' && step.status !== 'active'}
            zigZagOffset={zigZagOffset}
            onToggleExpand={toggleExpand}
            innerRef={(el) => { cardRefs.current[i] = el; }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Recursive step ────────────────────────────────────────────────

interface RoadmapStepProps {
  step: TaskStep;
  depth: number;
  index: number;
  globalIndex: number;
  animIndex: number;
  skip: boolean;
  isNextPending: boolean;
  expandedIds: Set<string>;
  isDimmed: boolean;
  zigZagOffset: number;
  onToggleExpand: (id: string) => void;
  innerRef?: React.Ref<HTMLDivElement>;
}

function RoadmapStep({
  step,
  depth,
  index,
  globalIndex,
  animIndex,
  skip,
  isNextPending,
  expandedIds,
  isDimmed,
  zigZagOffset,
  onToggleExpand,
  innerRef,
}: RoadmapStepProps) {
  const [childAnim, setChildAnim] = useState(-1);
  const [justCompleted, setJustCompleted] = useState(false);
  const prevStatusRef = useRef(step.status);
  const drillDown = useAppStore((s) => s.drillDownStep);
  const deleteStep = useAppStore((s) => s.deleteStep);

  const hasKids = (step.children?.length ?? 0) > 0;
  const isLeaf = !hasKids && !step.isDrilling;
  const isDone = step.status === 'completed';
  const isLive = step.status === 'active';
  const isStuck = step.status === 'stuck';
  const isGhost = step.status === 'skipped';
  const isPending = step.status === 'pending';
  const canDrill = depth < MAX_DEPTH;
  const expandable = isPending && isLeaf && canDrill;
  const isExpanded = expandedIds.has(step.id);
  const isTopLevel = depth === 0;

  useEffect(() => {
    if (step.status === 'completed' && prevStatusRef.current !== 'completed' && !skip) {
      setJustCompleted(true);
      const t = setTimeout(() => setJustCompleted(false), 600);
      prevStatusRef.current = step.status;
      return () => clearTimeout(t);
    }
    prevStatusRef.current = step.status;
  }, [step.status, skip]);

  useEffect(() => {
    if (!isExpanded || !hasKids || skip) { setChildAnim(-1); return; }
    const kids = step.children ?? [];
    const stepDelay = kids.length > 8 ? Math.max(60, Math.floor(1500 / kids.length)) : T_STEP;
    let ci = 0;
    let t: ReturnType<typeof setTimeout>;
    let r: number;
    function tick() {
      if (ci > kids.length) return;
      setChildAnim(ci);
      t = setTimeout(() => { ci++; r = requestAnimationFrame(tick); }, stepDelay);
    }
    r = requestAnimationFrame(tick);
    return () => { clearTimeout(t); cancelAnimationFrame(r); };
  }, [isExpanded, hasKids, step.children, skip]);

  const dotVisible = isTopLevel ? (skip || animIndex >= globalIndex) : (skip || animIndex >= index);
  const cardVisible = isTopLevel ? (skip || animIndex > globalIndex) : (skip || animIndex > index);
  const offsetX = isTopLevel ? getZigZagX(globalIndex, zigZagOffset) : 0;

  const handleExpand = async () => {
    if (expandable) {
      await drillDown(step.id);
      onToggleExpand(step.id);
    } else if (hasKids) {
      onToggleExpand(step.id);
    }
  };

  const cardMaxWidth = depth === 0 ? '24rem' : depth === 1 ? '22rem' : '20rem';
  const cardPadding = depth === 0 ? 'px-4 py-3' : depth === 1 ? 'px-3 py-2.5' : 'px-3 py-2';
  const numSize = depth === 0 ? 'w-7 h-7 text-xs' : depth === 1 ? 'w-6 h-6 text-[11px]' : 'w-5 h-5 text-[9px]';
  const titleSize = depth === 0 ? 'text-sm' : depth === 1 ? 'text-[13px]' : 'text-[12px]';
  const durationSize = depth === 0 ? 'text-[11px]' : 'text-[10px]';
  const dotSize = depth === 0 ? 13 : depth === 1 ? 11 : 9;
  const numIconSize = depth === 0 ? 13 : 10;

  const cardClasses = [
    'rounded-2xl border transition-all duration-200',
    skip ? '' : cardVisible ? 'animate-pop-in' : 'opacity-0',
    (expandable || hasKids) ? 'cursor-pointer hover:shadow-md active:scale-[0.985]' : '',
    isDone ? 'opacity-55' : '',
    isGhost ? 'opacity-30' : '',
    isStuck ? 'border-dashed opacity-45' : '',
    isDimmed && !skip ? 'opacity-40 scale-[0.98]' : '',
    isNextPending && !isDone && !skip ? 'animate-next-glow' : '',
    justCompleted ? 'animate-completion-flash' : '',
  ].filter(Boolean).join(' ');

  const dotDelay = isTopLevel ? `${globalIndex * T_STEP + T_ROAD}ms` : '0ms';
  const cardDelay = isTopLevel ? `${globalIndex * T_STEP + T_ROAD + T_DOT}ms` : '0ms';
  const rippleDelay = isTopLevel ? `${globalIndex * T_STEP + T_ROAD}ms` : '0ms';

  const cardBg = isLive
    ? 'var(--color-theme-primary-light)'
    : isDone
    ? 'var(--color-theme-surface)'
    : 'var(--color-surface, white)';
  const cardBorder = isLive
    ? 'var(--color-theme-primary)'
    : isNextPending && !isDone
    ? 'var(--color-theme-primary)'
    : 'var(--color-theme-border)';

  const expandableOrKids = expandable || hasKids;
  const clickHandlers = expandableOrKids
    ? {
        onClick: handleExpand,
        role: 'button' as const,
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleExpand(); }
        },
      }
    : {};

  const chevron = hasKids ? (
    <button
      onClick={(e) => { e.stopPropagation(); handleExpand(); }}
      className="p-1 rounded-lg transition-colors cursor-pointer"
      style={{ color: 'var(--color-text-muted)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-cream-200, #F0EDE5)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
        <ChevronDown size={depth === 0 ? 13 : 11} />
      </div>
    </button>
  ) : null;

  const drillBtn = expandable ? (
    <button
      onClick={(e) => { e.stopPropagation(); handleExpand(); }}
      className="p-1 rounded-lg transition-colors cursor-pointer"
      style={{ color: 'var(--color-text-muted)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-cream-200, #F0EDE5)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      title="Break this down further"
    >
      <GitBranchPlus size={depth === 0 ? 13 : 11} />
    </button>
  ) : null;

  const spinner = step.isDrilling ? (
    <Loader2 size={depth === 0 ? 13 : 11} className="animate-spin" style={{ color: 'var(--color-theme-primary)' }} />
  ) : null;

  const deleteBtn = (
    <button
      onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }}
      className="p-1 rounded-lg transition-colors cursor-pointer"
      style={{ color: 'var(--color-text-muted)' }}
      title="Delete this step"
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-warm-100, #FAE9DC)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <Trash2 size={depth === 0 ? 13 : 11} />
    </button>
  );

  const numberBadge = (
    <div
      className={`${numSize} rounded-full flex items-center justify-center font-semibold shrink-0`}
      style={{
        backgroundColor: isDone ? 'var(--color-theme-primary-light)' : isLive ? 'var(--color-theme-primary)' : 'var(--color-cream-200, #F0EDE5)',
        color: isLive ? 'white' : isDone ? 'var(--color-theme-primary-dark)' : 'var(--color-text-muted, #9A9A9A)',
      }}
    >
      {isDone ? (
        <Check size={numIconSize} strokeWidth={2.5} className={justCompleted ? 'animate-check-draw' : ''} />
      ) : isTopLevel ? (
        globalIndex + 1
      ) : (
        index + 1
      )}
    </div>
  );

  const titleEl = (
    <p
      className={`flex-1 ${titleSize} leading-snug min-w-0 ${isDone ? 'line-through' : 'font-medium'}`}
      style={{ color: isDone ? 'var(--color-text-muted)' : 'var(--color-text-primary, #2C2C2C)' }}
    >
      {step.title}
    </p>
  );

  const nextBadge = isNextPending && !isDone && !isLive && !skip ? (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: 'var(--color-theme-primary-light)', color: 'var(--color-theme-primary-dark)' }}
    >
      Next
    </span>
  ) : null;

  const duration = (
    <span
      className={`flex items-center gap-1 ${durationSize} px-2 py-0.5 rounded-full shrink-0`}
      style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-cream-100, #F9F6F1)' }}
    >
      <Clock size={depth === 0 ? 10 : 8} />{step.durationMinutes}m
    </span>
  );

  const childrenBlock = hasKids && isExpanded ? (
    <div className="relative" style={{ marginLeft: 20, marginTop: 4, marginBottom: 12 }}>
      <div
        className="absolute top-0 bottom-3"
        style={{ left: 8, width: 1.5, backgroundColor: 'var(--color-theme-border)' }}
      />
      {step.children!.map((child, ci) => (
        <RoadmapStep
          key={child.id}
          step={child}
          depth={depth + 1}
          index={ci}
          globalIndex={globalIndex}
          animIndex={childAnim}
          skip={skip}
          isNextPending={false}
          expandedIds={expandedIds}
          isDimmed={false}
          zigZagOffset={zigZagOffset}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </div>
  ) : null;

  const collapsedHint = hasKids && !isExpanded ? (
    <div className="flex items-center gap-1.5" style={{ marginLeft: isTopLevel ? 32 : 20, marginBottom: 12 }}>
      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-theme-border)' }} />
      <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
        {step.children!.length} sub-step{step.children!.length !== 1 ? 's' : ''}
      </span>
    </div>
  ) : null;

  const cardContent = (
    <div className={`flex items-center gap-3 ${cardPadding}`}>
      {numberBadge}
      {titleEl}
      {nextBadge}
      {duration}
      {drillBtn}
      {chevron}
      {deleteBtn}
      {spinner}
    </div>
  );

  // ─── Top-level ──────────────────────────────────────────────────
  if (isTopLevel) {
    return (
      <div
        className="w-full flex flex-col items-center"
        style={{
          zIndex: isExpanded ? 20 : 10,
          transform: `translateX(${offsetX}px)`,
          transition: 'transform 0.3s ease',
        }}
      >
        <div className="relative flex justify-center mb-2">
          {!skip && dotVisible && (
            <div
              className="absolute rounded-full animate-ripple pointer-events-none"
              style={{ width: 26, height: 26, top: -3, border: '2px solid var(--color-theme-primary)', animationDelay: rippleDelay, animationFillMode: 'both' }}
            />
          )}
          <div
            className={`relative z-10 rounded-full border-2 ${skip ? '' : dotVisible ? 'animate-dot-in' : 'opacity-0'}`}
            style={{
              width: isNextPending && !isDone ? 15 : dotSize,
              height: isNextPending && !isDone ? 15 : dotSize,
              animationDelay: dotDelay,
              animationFillMode: 'both',
              backgroundColor: isDone ? 'var(--color-theme-primary)' : isLive ? 'white' : 'var(--color-cream-100, #F9F6F1)',
              borderColor: isDone || isLive ? 'var(--color-theme-primary)' : isNextPending ? 'var(--color-theme-primary)' : 'var(--color-theme-border)',
              boxShadow: isLive
                ? '0 0 0 4px var(--color-theme-primary-glow, rgba(92,138,92,0.15))'
                : isNextPending && !isDone
                ? '0 0 0 3px var(--color-theme-primary-glow)'
                : 'none',
              transition: 'width 0.2s ease, height 0.2s ease, background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            }}
          />
        </div>

        <div
          ref={innerRef}
          className={cardClasses}
          style={{
            animationDelay: cardDelay,
            animationFillMode: 'both',
            width: '100%',
            maxWidth: cardMaxWidth,
            backgroundColor: cardBg,
            borderColor: cardBorder,
            transition: 'opacity 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease',
          }}
          {...clickHandlers}
        >
          {cardContent}
        </div>

        {childrenBlock}
        {collapsedHint}
      </div>
    );
  }

  // ─── Nested (depth > 0) ────────────────────────────────────────
  return (
    <div className="relative mb-3 last:mb-0">
      <div className="flex items-center gap-2">
        {/* Horizontal branch connector */}
        <div
          className="absolute"
          style={{
            left: 8,
            top: depth === 1 ? 14 : 12,
            width: 12,
            height: 1.5,
            backgroundColor: 'var(--color-theme-border)',
          }}
        />

        {/* Dot */}
        <div className="relative shrink-0" style={{ marginLeft: 0 }}>
          {!skip && dotVisible && (
            <div
              className="absolute rounded-full animate-ripple pointer-events-none"
              style={{ width: 20, height: 20, left: -3, top: -5, border: '1.5px solid var(--color-theme-primary)', animationDelay: rippleDelay, animationFillMode: 'both' }}
            />
          )}
          <div
            className={`relative z-10 rounded-full border-[1.5px] ${skip ? '' : dotVisible ? 'animate-dot-in' : 'opacity-0'}`}
            style={{
              width: dotSize,
              height: dotSize,
              animationDelay: dotDelay,
              animationFillMode: 'both',
              backgroundColor: isDone ? 'var(--color-theme-primary)' : isLive ? 'white' : 'var(--color-cream-100)',
              borderColor: isDone || isLive ? 'var(--color-theme-primary)' : 'var(--color-theme-border)',
              boxShadow: isLive ? '0 0 0 3px var(--color-theme-primary-glow, rgba(92,138,92,0.12))' : 'none',
              transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            }}
          />
        </div>

        {/* Card */}
        <div
          ref={innerRef}
          className={`flex-1 rounded-xl border transition-shadow duration-200 ${skip ? '' : cardVisible ? 'animate-pop-in' : 'opacity-0'} ${isDone ? 'opacity-55' : ''} ${isStuck ? 'border-dashed opacity-45' : ''} ${expandableOrKids ? 'cursor-pointer hover:shadow-md active:scale-[0.985]' : ''} ${isNextPending && !isDone && !skip ? 'animate-next-glow' : ''} ${justCompleted ? 'animate-completion-flash' : ''}`}
          style={{
            animationDelay: cardDelay,
            animationFillMode: 'both',
            backgroundColor: cardBg,
            borderColor: cardBorder,
            transition: 'opacity 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease',
          }}
          {...clickHandlers}
        >
          {cardContent}
        </div>
      </div>

      {childrenBlock}
      {collapsedHint}
    </div>
  );
}
