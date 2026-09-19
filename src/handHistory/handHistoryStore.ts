import { loadJSON, saveJSON } from '../storage/localStorage';
import { HandHistoryEntry } from './types';
import { cardToDisplay } from '../engine/cards';
import { handCategoryName } from '../engine/handEvaluator';
import { HeroDecisionRecord } from '../training/coach';

const KEY = 'handHistory';
const MAX_ENTRIES = 500;

export function loadHandHistory(): HandHistoryEntry[] {
  return loadJSON<HandHistoryEntry[]>(KEY, []);
}

export function saveHand(entry: HandHistoryEntry): void {
  const all = loadHandHistory();
  all.unshift(entry);
  if (all.length > MAX_ENTRIES) all.length = MAX_ENTRIES;
  saveJSON(KEY, all);
}

export function clearHandHistory(): void {
  saveJSON(KEY, []);
}

export interface HandHistoryFilters {
  mode?: 'guided' | 'free';
  result?: 'won' | 'lost' | 'chopped';
  street?: string;
}

export function filterHands(hands: HandHistoryEntry[], filters: HandHistoryFilters): HandHistoryEntry[] {
  return hands.filter((h) => {
    if (filters.mode && h.mode !== filters.mode) return false;
    if (filters.result === 'won' && h.heroNetResult <= 0) return false;
    if (filters.result === 'lost' && h.heroNetResult >= 0) return false;
    if (filters.result === 'chopped' && h.heroNetResult !== 0) return false;
    if (filters.street) {
      const reached = h.actionHistory.some((a) => a.street === filters.street) || h.community.length > 0;
      if (!reached) return false;
    }
    return true;
  });
}

export function handToPlainText(hand: HandHistoryEntry): string {
  const lines: string[] = [];
  lines.push(`Hand #${hand.handNumber} — ${new Date(hand.timestamp).toLocaleString()}`);
  lines.push(`Blinds ${hand.config.smallBlind}/${hand.config.bigBlind}, button seat ${hand.buttonSeat}`);
  for (const p of hand.players) {
    const cards = p.holeCards.length ? p.holeCards.map(cardToDisplay).join(' ') : '(unknown)';
    lines.push(`Seat ${p.seat}: ${p.name}${p.isHuman ? ' (you)' : ''} — ${cards} — start ${p.startingStack}, end ${p.endingStack}`);
  }
  lines.push(`Board: ${hand.community.map(cardToDisplay).join(' ') || '(none)'}`);
  lines.push('Actions:');
  for (const a of hand.actionHistory) {
    const amt = a.action.amount !== undefined ? ` ${a.action.amount}` : '';
    lines.push(`  [${a.street}] ${a.playerId}: ${a.action.type}${amt} (pot was ${a.potBefore})`);
  }
  if (hand.showdownResults) {
    lines.push('Showdown:');
    for (const r of hand.showdownResults) {
      const handDesc = r.handValue ? handCategoryName(r.handValue.category) : 'folded / not shown';
      lines.push(`  ${r.playerId}: ${handDesc} — won ${r.amountWon}`);
    }
  }
  if (hand.heroDecisions?.length) {
    lines.push('Your decisions:');
    for (const d of hand.heroDecisions) {
      const req = d.requiredEquity !== null ? `${(d.requiredEquity * 100).toFixed(1)}% required` : 'no bet to call';
      const est = d.estimatedEquity !== null ? `${(d.estimatedEquity * 100).toFixed(1)}% estimated` : 'n/a';
      lines.push(`  [${d.street}] ${d.action.type}${d.action.amount !== undefined ? ` ${d.action.amount}` : ''} — ${req}, ${est}`);
    }
    const mistake = findBiggestMistake(hand);
    if (mistake) lines.push(`Biggest likely mistake: ${mistake.street} ${mistake.action.type} (EV ${mistake.evOfCalling!.toFixed(1)})`);
  }
  if (hand.notes) lines.push(`Notes: ${hand.notes}`);
  return lines.join('\n');
}

export function handToJSON(hand: HandHistoryEntry): string {
  return JSON.stringify(hand, null, 2);
}

/**
 * The hero decision this hand with the worst expected value among calls/
 * raises/bets that actually put chips in (folding is never flagged — its EV
 * is always 0 by definition, so it can't be "the mistake"). This is a
 * heuristic identification based on the same pot-odds/simulation-equity
 * numbers shown live, not a solver verdict — most useful as a prompt to go
 * look at that specific decision, not a final judgment.
 */
export function findBiggestMistake(hand: HandHistoryEntry): HeroDecisionRecord | null {
  const candidates = (hand.heroDecisions ?? []).filter((d) => d.action.type !== 'fold' && d.action.type !== 'check' && d.evOfCalling !== null && d.evOfCalling < 0);
  if (candidates.length === 0) return null;
  return candidates.reduce((worst, d) => (d.evOfCalling! < worst.evOfCalling! ? d : worst));
}
