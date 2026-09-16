export type Suit = 'c' | 'd' | 'h' | 's';
export const SUITS: Suit[] = ['c', 'd', 'h', 's'];
export const SUIT_SYMBOLS: Record<Suit, string> = { c: '♣', d: '♦', h: '♥', s: '♠' };
export const SUIT_NAMES: Record<Suit, string> = { c: 'Clubs', d: 'Diamonds', h: 'Hearts', s: 'Spades' };

/** Card rank as a number: 2-10, 11=J, 12=Q, 13=K, 14=A. */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export interface Card {
  rank: Rank;
  suit: Suit;
}

const RANK_CHARS: Record<Rank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: 'T',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};
const CHAR_TO_RANK: Record<string, Rank> = Object.fromEntries(
  Object.entries(RANK_CHARS).map(([rank, ch]) => [ch, Number(rank) as Rank])
) as Record<string, Rank>;

export function cardToString(card: Card): string {
  return `${RANK_CHARS[card.rank]}${card.suit}`;
}

export function cardToDisplay(card: Card): string {
  return `${RANK_CHARS[card.rank]}${SUIT_SYMBOLS[card.suit]}`;
}

/** Parses shorthand like "Ah", "Td", "2c" into a Card. Throws on invalid input. */
export function parseCard(text: string): Card {
  const trimmed = text.trim();
  if (trimmed.length !== 2) throw new Error(`Invalid card string: "${text}"`);
  const rankChar = trimmed[0].toUpperCase();
  const suitChar = trimmed[1].toLowerCase() as Suit;
  const rank = CHAR_TO_RANK[rankChar];
  if (!rank) throw new Error(`Invalid rank in card string: "${text}"`);
  if (!SUITS.includes(suitChar)) throw new Error(`Invalid suit in card string: "${text}"`);
  return { rank, suit: suitChar };
}

export function cardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

export function rankName(rank: Rank): string {
  const names: Record<Rank, string> = {
    2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven',
    8: 'Eight', 9: 'Nine', 10: 'Ten', 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace',
  };
  return names[rank];
}
