# Research Notes: No-Limit Texas Hold'em Rules & Strategy

This document summarises the rules and strategic concepts implemented in this
app, with sources. It is a reference for correctness decisions made in the
engine and curriculum — not a reproduction of any proprietary material.
No solver output or copyrighted text is reproduced; all summaries below are
written in our own words.

## 1. Core rules

- **Objective & structure**: Each player gets two private hole cards; five
  community cards are dealt face up in stages (flop=3, turn=1, river=1) and
  shared by all players. Betting rounds occur preflop, and after the flop,
  turn, and river. The best five-card hand made from any combination of the
  seven available cards wins the pot at showdown.
  Source: [How to play no-limit Texas hold'em — poker.org](https://www.poker.org/poker-strategy/poker-for-beginners/how-to-play-no-limit-texas-holdem-apMcl8j2F47y/)

- **Dealer button & blinds**: A dealer button marks the nominal dealer and
  rotates clockwise one seat after every hand. The player left of the button
  posts the small blind, and the next player posts the big blind. Preflop
  action starts left of the big blind (under the gun); postflop action starts
  with the first active player left of the button. Heads-up is a special
  case: the button posts the small blind and acts first preflop, but acts
  second on every later street.
  Source: [No Limit Texas Hold'em Rules — Flop Turn River](https://www.flopturnriver.com/poker-strategy/no-limit-texas-holdem-rules-19012/);
  [PokerListings betting rules](https://www.pokerlistings.com/poker-guides/texas-holdem-betting-rules)

- **Betting actions**: fold, check (only if no outstanding bet), call
  (match the current bet), bet/raise. In no-limit, a player may bet or raise
  any amount up to the whole of their remaining stack ("all-in") at any time.
  Source: [poker.org — No-Limit Hold'em](https://www.poker.org/poker-strategy/poker-for-beginners/how-to-play-no-limit-texas-holdem-apMcl8j2F47y/)

- **Minimum raise rule**: A raise must be at least the size of the previous
  bet or raise in the same round. Example: if a player bets 5, the minimum
  legal raise makes the total 10 (a raise of 5 on top of the 5 bet). A raise
  smaller than the previous raise increment is only allowed if it is a short
  all-in (see below), and such a short all-in does not reopen the betting to
  players who already acted and called the previous full bet, unless it is
  itself a full raise.
  Source: [PokerListings — Texas Hold'em Betting Rules](https://www.pokerlistings.com/poker-guides/texas-holdem-betting-rules)

- **All-ins and side pots**: A player may go all-in for less than the
  current bet/call amount. Chips beyond what an all-in player can match are
  set aside in one or more **side pots**, contested only by the players who
  covered them. The all-in player can only win a main pot capped at their own
  contribution multiplied by the number of contesting players. Our
  `potManager` implements this generally by layering contribution levels.
  Source: [PokerListings side pot explanation](https://www.pokerlistings.com/poker-guides/texas-holdem-betting-rules);
  poker.org how-to-play guide (link above)

## 2. Hand rankings and tie-breaking

Standard ranking, high to low: Straight Flush > Four of a Kind > Full House >
Flush > Straight > Three of a Kind > Two Pair > One Pair > High Card.

- Ties are broken by comparing the best five-card hand's ranks in order
  (primary rank group(s) first, then remaining "kicker" cards) from highest
  to lowest.
- **Kickers** only matter for high-card, one-pair, two-pair, three-of-a-kind,
  and four-of-a-kind hands (differentiating the unpaired side cards).
  Straights, flushes, full houses, and straight flushes are fully determined
  by their five ranks and use no separate kicker comparison beyond the
  hand's own rank sequence.
- If both players' best five-card hands are exactly equal in ranking, the pot
  is **split** evenly (with any odd chip going to the first eligible player
  clockwise from the button, per common cardroom convention).
- The **wheel** (A-2-3-4-5) is the lowest straight; the ace plays low only in
  this case and does not extend a straight upward (e.g. it cannot make
  2-3-4-5-6 with itself again "high").
  Sources: [PokerNews — Poker Hand Rankings & Split Pots](https://www.pokernews.com/poker-hands/tied-poker-hands.htm);
  [PokerNews — Kickers in Poker](https://www.pokernews.com/poker-hands/kicker-in-poker.htm)

## 3. Poker mathematics

- **Outs**: unseen cards that improve a hand to (likely) the best hand.
- **Rule of 2 and 4**: an approximation for probability of hitting outs by
  the river — multiply outs by 4 after the flop (2 cards to come) or by 2
  after the turn (1 card to come) to estimate percentage equity. It is
  explicitly an approximation (accurate to a couple of percentage points for
  low out counts; drifts more for high out counts, e.g. 12+ outs) — we always
  label it as such and also show the exact hypergeometric calculation.
- **Pot odds**: ratio of the call amount to the resulting pot
  (call / (pot + call)) gives the break-even equity needed to call profitably
  in isolation.
- **Expected value (EV)**: the probability-weighted average outcome of an
  action; comparing EV(call), EV(fold)=0, EV(bet)/EV(raise) drives decisions
  under uncertainty.
- **Implied/reverse implied odds**: adjust required equity for money you
  expect to win/lose on future streets beyond the current pot.
- **Fold equity**: the extra value a bet/raise generates purely from the
  chance the opponent folds, independent of card equity.
  Sources: [GTO Wizard — What are Pot Odds?](https://blog.gtowizard.com/what-are-pot-odds-in-poker/);
  [GTO Wizard — Mathematical Misconceptions in Poker](https://blog.gtowizard.com/mathematical-misconceptions-in-poker/);
  [GTO Wizard — Visualizing Implied Odds](https://blog.gtowizard.com/visualizing-implied-odds/);
  [GTO Wizard — The Value of Fold Equity](https://blog.gtowizard.com/the-value-of-fold-equity-experiment/)

## 4. Preflop & positional strategy

Later position sees more information (how many opponents entered, for how
much) before acting, which lets a player play a wider range of hands
profitably than the same hand would be in an early position. Opening ranges
generally tighten in early position and widen towards the button; the blinds
face different pot-odds and closing-the-action considerations. We use
simplified, commonly-cited range shapes (not a proprietary solver output) to
seed the starting-hand matrix and bot preflop logic, cross-checked against
multiple public sources rather than one.
Sources: [Upswing Poker — Poker Hand Rankings & Starting Hands](https://upswingpoker.com/poker-hands-rankings/);
[GTO Wizard blog, general position/range articles](https://blog.gtowizard.com/)

## 5. Postflop concepts

- **Board texture**: dry (few draws, disconnected), wet (many straight/flush
  draws), paired, and monotone (all one suit) boards change which ranges
  connect and how often continuation bets should fire.
- **Range vs. nut advantage**: the preflop aggressor often has a wider range
  advantage (more total equity) and/or a nut advantage (more very strong
  hands) on certain boards, which supports betting frequently on those
  textures.
- **Bet sizing & SPR**: bet size relative to pot, and stack-to-pot ratio
  (effective stack / pot), shape how many streets of value/bluff are
  available and how committed a stack becomes.
- **Balance vs. exploitation**: a theoretically balanced (GTO-inspired)
  strategy is hard to exploit but assumes rational opposition; against
  observed tendencies, deliberately unbalanced exploitative deviations can
  have higher EV. The app labels which kind of advice is being given.
  Sources: [GTO Wizard — The Initial Bettor's Advantage](https://blog.gtowizard.com/the-initial-bettors-advantage/);
  [GTO Wizard — How to Solve Toy Games](https://blog.gtowizard.com/how-to-solve-toy-games/);
  [GTO Wizard — Math of Multi-Street Bluffs](https://blog.gtowizard.com/the-math-of-multistreet-bluffs/)

## 6. GTO concepts used in Level 5

Minimum defence frequency, polarised/merged/condensed ranges, and
value-to-bluff (alpha) ratios are introduced qualitatively with the same
"pot-sized bet → roughly 1 bluff per 2 value bets" style reasoning found in
mainstream poker-math education, always labelled as a simplified toy-game
result and not as a solved-game guarantee for any specific real spot.
Source: [GTO Wizard — When Is Bluffing Profitable?](https://blog.gtowizard.com/when-is-bluffing-profitable-the-key-factors-you-need-to-know/)

## 7. Engine/library decision

We evaluated `pokersolver` (npm, MIT licensed, ~5 years since last release)
and a couple of similarly small hand-evaluator packages. None had recent
maintenance activity, independent test suites we could verify quickly, or
first-class support for the specific side-pot/short-all-in edge cases this
app needs to teach correctly. Given the requirement to independently verify
correctness with our own unit tests regardless of source, we implemented a
**from-scratch 7-card hand evaluator** (`src/engine/handEvaluator.ts`) using
the straightforward "best 5 of 7" approach, and a **from-scratch betting
state machine / side-pot calculator**, both covered by an extensive Vitest
suite (see `src/engine/*.test.ts`). This avoids taking on an unmaintained
dependency while meeting the "independently verified" requirement directly.

## 8. Bot design

Bots are simple heuristic/range-driven agents, not real-time solvers. Each
personality (tight-passive, loose-passive, tight-aggressive, loose-aggressive,
balanced-advanced) scores its own two hole cards plus the visible board using
hand-strength heuristics and Monte-Carlo equity vs. a random-hand baseline,
then maps that score plus personality parameters (aggression, bluff
frequency, calling threshold) to an action. Bots never receive folded
players' hole cards, other players' hole cards, or future community cards —
enforced by only passing each bot the public `TableState` plus its own hole
cards (tested in `src/bots/informationBoundary.test.ts`).

## 9. Honesty about feedback types

Throughout the UI, we label numbers as one of: **exact math** (pot odds,
break-even equity, combinatorics), **simulation-based estimate** (Monte Carlo
equity vs. a range), or **heuristic/strategic opinion** (bet-sizing advice,
bluff/value read). We do not present heuristic opinions as solved facts.
