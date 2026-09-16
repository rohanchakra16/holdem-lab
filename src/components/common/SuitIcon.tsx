import { Suit } from '../../engine/cards';

const PATHS: Record<Suit, string> = {
  s: 'M12 2C8 6.5 3 9.8 3 14.2c0 3 2.3 5 5 5 1.4 0 2.7-.5 3.6-1.4-.3 2-1.2 3.6-2.9 4.7-.4.3-.2.9.3.9h6c.5 0 .7-.6.3-.9-1.7-1.1-2.6-2.7-2.9-4.7.9.9 2.2 1.4 3.6 1.4 2.7 0 5-2 5-5C21 9.8 16 6.5 12 2z',
  h: 'M12 21S3 14.6 3 8.7C3 5.5 5.5 3 8.6 3c1.7 0 3.3.9 4.4 2.3C14.1 3.9 15.7 3 17.4 3 20.5 3 23 5.5 23 8.7 23 14.6 12 21 12 21z',
  d: 'M12 2 21 12 12 22 3 12 12 2z',
  c: 'M12 8.4c1.9 0 3.5 1.6 3.5 3.5 0 .8-.3 1.6-.8 2.2.4-.1.9-.2 1.3-.2 2.2 0 4 1.8 4 4s-1.8 4-4 4c-1.6 0-3-.9-3.6-2.3.2 1.9 1.1 3.4 2.7 4.5.4.3.2.9-.3.9h-6c-.5 0-.7-.6-.3-.9 1.6-1.1 2.5-2.6 2.7-4.5-.6 1.4-2 2.3-3.6 2.3-2.2 0-4-1.8-4-4s1.8-4 4-4c.4 0 .9.1 1.3.2-.5-.6-.8-1.4-.8-2.2 0-1.9 1.6-3.5 3.5-3.5z',
};

export function SuitIcon({ suit, size = 16, className }: { suit: Suit; size?: number; className?: string }) {
  const isRed = suit === 'h' || suit === 'd';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={{ color: isRed ? 'var(--color-burgundy-400)' : 'var(--color-ink-900)' }}
      aria-hidden="true"
    >
      <path d={PATHS[suit]} />
    </svg>
  );
}
