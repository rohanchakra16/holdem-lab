import { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';

type PanelTone = 'surface' | 'raised' | 'felt';

export function Panel({
  children,
  className,
  title,
  right,
  tone = 'surface',
  padded = true,
}: PropsWithChildren<{ className?: string; title?: ReactNode; right?: ReactNode; tone?: PanelTone; padded?: boolean }>) {
  const toneClasses: Record<PanelTone, string> = {
    surface: 'bg-ink-850/90 shadow-[var(--shadow-card)]',
    raised: 'bg-ink-850 shadow-[var(--shadow-panel)]',
    felt: 'bg-felt-900/40 shadow-[var(--shadow-card)] ring-1 ring-felt-700/30',
  };
  return (
    <div className={clsx('rounded-[var(--radius-md)]', toneClasses[tone], className)}>
      {(title || right) && (
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
          {title && <h3 className="text-[13px] font-semibold tracking-wide text-sand-300">{title}</h3>}
          {right}
        </div>
      )}
      <div className={padded ? 'p-4' + (title || right ? ' pt-1.5' : '') : ''}>{children}</div>
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'brass';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-felt-500 text-ivory-100 shadow-[0_1px_0_0_theme(colors.felt.300/40%)_inset,0_4px_10px_-2px_theme(colors.felt.900/70%)] hover:bg-felt-400 active:bg-felt-600 active:scale-[0.98]',
  brass:
    'bg-brass-500 text-ink-950 shadow-[0_1px_0_0_theme(colors.brass.300/50%)_inset,0_4px_10px_-2px_theme(colors.brass.900/60%)] hover:bg-brass-400 active:bg-brass-600 active:scale-[0.98]',
  secondary: 'bg-ink-700 text-sand-100 hover:bg-ink-600 active:bg-ink-800 active:scale-[0.98]',
  danger: 'bg-burgundy-500 text-ivory-100 hover:bg-burgundy-400 active:bg-burgundy-600 active:scale-[0.98]',
  ghost: 'bg-transparent text-sand-400 hover:bg-ink-800 hover:text-sand-200 active:scale-[0.98]',
};

export function Button({
  variant = 'secondary',
  className,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>) {
  return (
    <button
      className={clsx(
        'rounded-[var(--radius-sm)] px-3.5 py-2 text-sm font-medium transition-[background-color,transform,opacity] duration-[var(--duration-fast)] ease-[var(--ease-out-expo)]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none',
        'focus-visible:outline-2 focus-visible:outline-brass-400 focus-visible:outline-offset-2',
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}

type BadgeTone = 'neutral' | 'good' | 'bad' | 'warn' | 'info' | 'brass';

export function Badge({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: BadgeTone }>) {
  const toneClasses: Record<BadgeTone, string> = {
    neutral: 'bg-ink-700 text-sand-300',
    good: 'bg-felt-800/70 text-felt-200 ring-1 ring-felt-600/40',
    bad: 'bg-burgundy-600/40 text-burgundy-300 ring-1 ring-burgundy-500/40',
    warn: 'bg-brass-600/30 text-brass-300 ring-1 ring-brass-500/30',
    info: 'bg-ink-700 text-sand-200 ring-1 ring-ink-500/50',
    brass: 'bg-brass-500/15 text-brass-400 ring-1 ring-brass-500/30',
  };
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-[var(--radius-xs)] px-2 py-0.5 text-[11px] font-semibold tracking-wide', toneClasses[tone])}>
      {children}
    </span>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-ink-850 px-3.5 py-3">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-sand-500">{label}</div>
      <div className="tabular mt-0.5 text-[22px] font-semibold leading-none text-sand-100">{value}</div>
      {sub && <div className="mt-1.5 text-xs text-sand-500">{sub}</div>}
    </div>
  );
}

export function Tooltip({ text, children }: PropsWithChildren<{ text: string }>) {
  return (
    <span className="group relative inline-flex items-center border-b border-dotted border-sand-600 cursor-help">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-56 -translate-x-1/2 rounded-[var(--radius-xs)] bg-ink-950 px-3 py-2 text-xs text-sand-200 shadow-[var(--shadow-raised)] ring-1 ring-ink-600 group-hover:block">
        {text}
      </span>
    </span>
  );
}

export function ProgressBar({ value, tone = 'felt' }: { value: number; tone?: 'felt' | 'brass' }) {
  const barColor = tone === 'felt' ? 'bg-felt-500' : 'bg-brass-500';
  return (
    <div className="h-1.5 w-full rounded-full bg-ink-700 overflow-hidden">
      <div className={clsx('h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-expo)]', barColor)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/** For zero-progress states — a call to action reads better than an empty bar. */
export function ReadyState({ label = 'Ready to begin', onStart, actionLabel = 'Start' }: { label?: string; onStart?: () => void; actionLabel?: string }) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-ink-800/70 px-3 py-2">
      <span className="text-xs font-medium text-sand-400">{label}</span>
      {onStart && (
        <button onClick={onStart} className="text-xs font-semibold text-felt-300 hover:text-felt-200">
          {actionLabel} →
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-ink-600 px-6 py-10 text-center">
      {icon && <div className="text-sand-600">{icon}</div>}
      <div className="text-sm font-semibold text-sand-300">{title}</div>
      {description && <div className="max-w-sm text-xs text-sand-500">{description}</div>}
      {action}
    </div>
  );
}
