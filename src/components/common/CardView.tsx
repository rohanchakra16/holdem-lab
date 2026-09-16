import type { Card } from '../../engine/cards';
import { SuitIcon } from './SuitIcon';

const RANK_LABEL: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

const SIZES = {
  sm: { w: 30, h: 42, rank: 11, suit: 9, corner: 'top-0.5 left-0.5' },
  md: { w: 44, h: 62, rank: 15, suit: 12, corner: 'top-1 left-1' },
  lg: { w: 62, h: 88, rank: 20, suit: 15, corner: 'top-1.5 left-1.5' },
} as const;

export function CardView({
  card,
  size = 'md',
  faceDown = false,
}: {
  card?: Card;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
}) {
  const s = SIZES[size];

  if (faceDown || !card) {
    return (
      <div
        className="relative shrink-0 rounded-[var(--radius-xs)] shadow-[var(--shadow-card)] ring-1 ring-black/40"
        style={{
          width: s.w,
          height: s.h,
          background: 'linear-gradient(155deg, var(--color-felt-700) 0%, var(--color-felt-900) 100%)',
        }}
      >
        <div
          className="absolute inset-[3px] rounded-[3px]"
          style={{
            border: '1.5px solid oklch(85% 0.08 80 / 0.35)',
            backgroundImage:
              'repeating-linear-gradient(45deg, oklch(100% 0 0 / 0.05) 0px, oklch(100% 0 0 / 0.05) 1.5px, transparent 1.5px, transparent 7px)',
          }}
        />
      </div>
    );
  }

  const isRed = card.suit === 'h' || card.suit === 'd';
  const rankColor = isRed ? 'text-burgundy-500' : 'text-ink-900';

  return (
    <div
      className="relative shrink-0 rounded-[var(--radius-xs)] bg-ivory-100 shadow-[var(--shadow-card)] ring-1 ring-black/10 select-none"
      style={{ width: s.w, height: s.h }}
    >
      <div className={`absolute ${s.corner} flex flex-col items-center leading-none ${rankColor}`}>
        <span className="font-semibold" style={{ fontSize: s.rank, fontFamily: 'var(--font-sans)' }}>
          {RANK_LABEL[card.rank]}
        </span>
        <SuitIcon suit={card.suit} size={s.suit} className="-mt-0.5" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-90">
        <SuitIcon suit={card.suit} size={s.h * 0.4} />
      </div>
    </div>
  );
}

export function CardRow({ cards, faceDown = false, size = 'md' }: { cards: Card[]; faceDown?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex gap-1.5">
      {cards.map((c, i) => (
        <CardView key={i} card={c} faceDown={faceDown} size={size} />
      ))}
    </div>
  );
}
