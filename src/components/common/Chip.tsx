/** A small authored poker-chip glyph, used for bet/pot amounts instead of a plain pill. */
export function Chip({ value, size = 'sm', tone = 'brass' }: { value: number | string; size?: 'sm' | 'md'; tone?: 'brass' | 'felt' | 'ink' }) {
  const dims = size === 'sm' ? 18 : 24;
  const toneColor = { brass: 'var(--color-brass-500)', felt: 'var(--color-felt-500)', ink: 'var(--color-ink-600)' }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-950/70 py-0.5 pl-0.5 pr-2 ring-1 ring-black/30">
      <svg width={dims} height={dims} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill={toneColor} stroke="oklch(20% 0 0 / 0.5)" strokeWidth="1" />
        <circle cx="12" cy="12" r="7.5" fill="none" stroke="oklch(100% 0 0 / 0.35)" strokeWidth="1.2" strokeDasharray="2.6 3.4" />
        <circle cx="12" cy="12" r="4.5" fill="oklch(100% 0 0 / 0.14)" />
      </svg>
      <span className="tabular text-xs font-semibold text-sand-100">{value}</span>
    </span>
  );
}
