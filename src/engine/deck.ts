import { Card, RANKS, SUITS } from './cards';
import { RNG, shuffleInPlace } from './rng';

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export class Deck {
  private cards: Card[];

  constructor(rng: RNG) {
    this.cards = shuffleInPlace(buildDeck(), rng);
  }

  /** Number of cards remaining. */
  get remaining(): number {
    return this.cards.length;
  }

  draw(): Card {
    const card = this.cards.pop();
    if (!card) throw new Error('Deck is empty: cannot draw another card');
    return card;
  }

  drawMany(count: number): Card[] {
    const drawn: Card[] = [];
    for (let i = 0; i < count; i++) drawn.push(this.draw());
    return drawn;
  }
}
