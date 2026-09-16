import { Panel, Tooltip } from '../common/ui';

const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const RANK_VALUE: Record<string, number> = { A: 14, K: 13, Q: 12, J: 11, T: 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };

function tierFor(r1: string, r2: string, suited: boolean): 0 | 1 | 2 | 3 {
  const a = Math.max(RANK_VALUE[r1], RANK_VALUE[r2]);
  const b = Math.min(RANK_VALUE[r1], RANK_VALUE[r2]);
  const isPair = r1 === r2;
  const gap = a - b;
  let score = (a + b) / 28;
  if (isPair) score += 0.28 + a / 60;
  if (suited) score += 0.07;
  if (!isPair && gap === 1) score += 0.04;
  else if (!isPair && gap >= 5) score -= 0.09;
  if (score > 0.72) return 0; // premium / raise anywhere
  if (score > 0.55) return 1; // strong / raise most positions
  if (score > 0.42) return 2; // speculative / late position or call
  return 3; // fold most of the time
}

const TIER_COLORS = ['bg-felt-600/80', 'bg-felt-600/60', 'bg-brass-600/50', 'bg-ink-800'];
const TIER_LABELS = ['Premium — raise from any position', 'Strong — raise from most positions', 'Speculative — late position / multiway', 'Usually fold'];

export function StartingHandMatrix() {
  return (
    <Panel title="Starting Hand Matrix (illustrative)">
      <p className="text-xs text-sand-500 mb-3">
        A simplified, illustrative shape for opening ranges — not a single "correct" solved chart. Real ranges shift with
        stack depth, opponents, and table dynamics (see Level 4).
      </p>
      <div className="grid gap-0.5 w-fit mx-auto" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
        {RANK_ORDER.map((r1, i) =>
          RANK_ORDER.map((r2, j) => {
            const suited = i < j;
            const isPair = i === j;
            const label = isPair ? `${r1}${r2}` : suited ? `${r1}${r2}s` : `${r2}${r1}o`;
            const tier = tierFor(r1, r2, suited);
            return (
              <Tooltip key={`${i}-${j}`} text={`${label}: ${TIER_LABELS[tier]}`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[9px] font-medium text-sand-100 ${TIER_COLORS[tier]}`}>
                  {label}
                </div>
              </Tooltip>
            );
          })
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-sand-400">
        {TIER_LABELS.map((l, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-sm ${TIER_COLORS[i]}`} /> {l}
          </div>
        ))}
      </div>
    </Panel>
  );
}
