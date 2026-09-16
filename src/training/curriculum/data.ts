export interface QuizCheck {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  /** One-line summary shown in lesson rows and the "up next" panel. */
  description: string;
  blocks: string[]; // paragraphs; lines starting with "- " render as bullets
  /** Optional diagram rendered between the intro and the rest of the content. */
  visual?: import('../../components/learn/LessonVisual').LessonVisualSpec;
  check?: QuizCheck;
}

export interface Level {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export const CURRICULUM: Level[] = [
  {
    id: 'level-1',
    title: 'Level 1 · Absolute Basics',
    description: 'The rules, the deck, hand rankings, and how a hand of No-Limit Hold’em actually flows.',
    lessons: [
      {
        id: 'objective-and-deck',
        title: 'The Objective & The Deck',
        description: 'What you’re trying to do, and the 52 cards you’re doing it with.',
        blocks: [
          'Texas Hold’em is played with a standard 52-card deck: 4 suits (clubs, diamonds, hearts, spades) with no suit outranking another, and 13 ranks per suit (2 through 10, Jack, Queen, King, Ace).',
          'The goal each hand is simple: win chips, either by having the best hand at showdown or by getting every other player to fold before showdown.',
          '- Each player is dealt 2 private "hole cards" that only they can see.',
          '- Up to 5 shared "community cards" are dealt face-up in the middle of the table.',
          '- Every player builds the best possible 5-card hand from their 2 hole cards plus the 5 community cards (any combination).',
        ],
        check: {
          question: 'How many hole cards does each player get in Texas Hold’em?',
          options: ['1', '2', '4', '5'],
          correctIndex: 1,
          explanation: 'Each player gets exactly 2 private hole cards, combined with up to 5 shared community cards.',
        },
      },
      {
        id: 'streets',
        title: 'Hole Cards, Community Cards & Streets',
        description: 'How a hand unfolds in stages, from preflop to the river.',
        blocks: [
          'A hand is dealt in stages called "streets", with a round of betting after each:',
          '- Preflop: each player has just their 2 hole cards.',
          '- Flop: 3 community cards are dealt at once.',
          '- Turn: a 4th community card is dealt.',
          '- River: a 5th and final community card is dealt.',
          'After the river betting round, any players still in the hand reveal their cards at "showdown", and the best 5-card hand wins.',
        ],
        check: {
          question: 'How many community cards are dealt on the flop?',
          options: ['1', '2', '3', '5'],
          correctIndex: 2,
          explanation: 'The flop deals 3 community cards at once, followed by 1 more on the turn and 1 more on the river.',
        },
      },
      {
        id: 'hand-rankings',
        title: 'Hand Rankings',
        description: 'The nine hand categories, from high card to straight flush.',
        visual: { kind: 'cards', cards: ['9h', '8h', '7h', '6h', '5h'], caption: 'A straight flush — the strongest possible hand' },
        blocks: [
          'From strongest to weakest, the standard hand categories are:',
          '- Straight Flush (5 consecutive ranks, same suit)',
          '- Four of a Kind',
          '- Full House (three of a kind + a pair)',
          '- Flush (5 cards of the same suit, not consecutive)',
          '- Straight (5 consecutive ranks, mixed suits)',
          '- Three of a Kind',
          '- Two Pair',
          '- One Pair',
          '- High Card (no pair or better)',
          'A higher category always beats a lower one, no matter what the specific cards are — any full house beats any flush, for example.',
        ],
        check: {
          question: 'Which hand is stronger?',
          options: ['A flush (5 same-suit cards)', 'A straight (5 consecutive ranks)'],
          correctIndex: 0,
          explanation: 'Flush beats straight in the standard ranking. Category always matters more than the specific card ranks within it.',
        },
      },
      {
        id: 'kickers-and-ties',
        title: 'Kickers & Ties',
        description: 'How ties are broken, and when a pot really does get split.',
        visual: { kind: 'hand-ladder', highlight: [1] },
        blocks: [
          'When two players have the same hand category, the tie is broken by comparing the ranks that make up the hand, then any leftover "kicker" cards, from highest to lowest.',
          'Example: both players have a pair of Aces. Player A’s other 3 cards are K-9-4; Player B’s are Q-9-4. Player A wins — the King kicker beats the Queen.',
          'Kickers matter for High Card, One Pair, Two Pair, Three of a Kind, and Four of a Kind. Straights, flushes, and full houses are fully decided by their own 5 ranks.',
          'If both players’ best 5-card hands are truly identical in rank, the pot is split evenly — this is common when the community cards alone make the best hand ("the board plays").',
        ],
        check: {
          question: 'Two players both have two pair, Kings and 4s. Player A has a 9 kicker, Player B has a 7 kicker. Who wins?',
          options: ['Player A', 'Player B', 'It’s automatically a split pot'],
          correctIndex: 0,
          explanation: 'With identical two pair, the kicker (the 5th card) breaks the tie. 9 beats 7.',
        },
      },
      {
        id: 'actions',
        title: 'Actions: Check, Bet, Call, Raise, Fold, All-in',
        description: 'The six moves available to you on every betting round.',
        blocks: [
          '- Fold: give up your hand and any chance at the pot.',
          '- Check: pass the action without betting — only legal if nobody has bet yet this round.',
          '- Bet: put chips in when nobody else has bet yet this round.',
          '- Call: match the current bet to stay in the hand.',
          '- Raise: increase the size of the current bet, forcing others to match the new amount or fold.',
          '- All-in: bet or call using your entire remaining stack. In No-Limit Hold’em you can go all-in at any time.',
        ],
        check: {
          question: 'You can only check if...',
          options: ['You have a strong hand', 'Nobody has bet yet this betting round', 'It is the river'],
          correctIndex: 1,
          explanation: 'Checking passes the action without adding chips — it is only legal when there is no outstanding bet to respond to.',
        },
      },
      {
        id: 'blinds-and-flow',
        title: 'Blinds, the Button & a Full Hand',
        description: 'Forced bets, the dealer button, and a full hand start to finish.',
        blocks: [
          'The dealer button marks the nominal dealer and rotates one seat clockwise every hand. It matters because it determines betting order — acting later is an advantage (see Level 2).',
          'Before cards are dealt, the player left of the button posts the "small blind" and the next player posts the "big blind" — forced bets that seed the pot and give everyone a reason to play.',
          'Preflop, action starts with the player left of the big blind. On every later street, action starts with the first active player left of the button.',
          'A full hand: post blinds → deal hole cards → preflop betting → flop + betting → turn + betting → river + betting → showdown (or someone wins earlier if everyone else folds).',
        ],
        check: {
          question: 'After the flop, turn, and river, who typically acts first?',
          options: [
            'The player left of the big blind, every street',
            'The first active player left of the dealer button',
            'Whoever has the biggest stack',
          ],
          correctIndex: 1,
          explanation: 'Preflop is the exception (action starts left of the BB). On the flop, turn, and river, action starts with the first active player left of the button.',
        },
      },
    ],
  },
  {
    id: 'level-2',
    title: 'Level 2 · Basic Decision-Making',
    description: 'Starting hand strength, position, sizing, and the mistakes that cost beginners the most.',
    lessons: [
      {
        id: 'starting-hands',
        title: 'Strong & Weak Starting Hands',
        description: 'What makes two hole cards strong before the flop even comes.',
        blocks: [
          'Not all starting hands are equal. Roughly, strength comes from: high card rank, being a pair, being suited (same suit — flush potential), and being connected (close in rank — straight potential).',
          '- Premium: AA, KK, QQ, AKs (suited)',
          '- Strong: JJ, TT, AQ, AKo (offsuit), KQs',
          '- Speculative (better multiway / in position): small pairs, suited connectors like 76s',
          '- Weak: disconnected, low, offsuit hands like J3o, 84o',
          'Starting-hand strength is necessary but not sufficient — position and stack depth change how a hand should be played.',
        ],
        check: {
          question: 'Which of these hands is generally the strongest starting hand?',
          options: ['J3 offsuit', 'A-K suited', '7-2 offsuit'],
          correctIndex: 1,
          explanation: 'AKs combines a high pair of overcards, suitedness, and connectivity — one of the strongest non-pair hands.',
        },
      },
      {
        id: 'position',
        title: 'Position',
        description: 'Why acting later is worth more than the two cards you hold.',
        blocks: [
          'Position describes when you act relative to other players. Acting later ("in position") means you see what everyone before you does before deciding.',
          'That information is valuable: you know how many people are in the pot, and how much strength they’ve represented, before committing chips.',
          'Because of this, a wider range of hands is profitable to play from late position (like the button) than from early position, where you act with the least information all hand.',
          'Acting "out of position" (having to act first) is a real, quantifiable disadvantage — it is one reason the same two cards can be a clear fold from one seat and a clear raise from another.',
        ],
        check: {
          question: 'Why is the button (last to act postflop) considered the best seat?',
          options: [
            'You get better cards there',
            'You act last each street, with the most information before deciding',
            'You post a mandatory blind there',
          ],
          correctIndex: 1,
          explanation: 'The button never posts a blind and acts last on every postflop street, maximizing the information available before each decision.',
        },
      },
      {
        id: 'stacks-and-sizing',
        title: 'Effective Stack Size & Basic Bet Sizing',
        description: 'How much is really at stake, and how to size a bet.',
        blocks: [
          '"Effective stack" between two players is the SMALLER of their two stacks — that’s the most either can actually win or lose in the hand.',
          'Deep effective stacks (100+ big blinds) allow more post-flop maneuvering; short effective stacks compress decisions toward simpler all-in-or-fold spots.',
          'Common bet sizes are expressed as a fraction of the pot: one-third pot (small, "blocker"/thin value), half pot, two-thirds pot (a common standard size), pot-sized, or all-in (a "shove").',
          'Bigger bets charge more to draws (good for protecting a made hand) but also require more folding equity to show a profit as a bluff, and risk more when wrong.',
        ],
      },
      {
        id: 'value-and-bluffing',
        title: 'Value Betting & Basic Bluffing',
        description: 'Betting to get called, and betting to get folds.',
        blocks: [
          'A value bet is made when you expect worse hands to call — you’re betting because you think you’re ahead and want to get paid.',
          'A bluff is made when your hand likely isn’t best, but you bet anyway to make a better hand fold. It profits purely from "fold equity" — the chance the opponent gives up.',
          'A common beginner error is betting a mediocre hand for a reason that’s neither: not strong enough to value bet profitably, not weak enough (or with insufficient fold equity) to bluff for a clear reason.',
        ],
      },
      {
        id: 'beginner-mistakes',
        title: 'Common Beginner Mistakes',
        description: 'The five habits that quietly cost new players the most.',
        blocks: [
          '- Playing too many starting hands, especially out of position.',
          '- "Calling to see what happens" instead of having a plan for later streets.',
          '- Overvaluing weak pairs and weak kickers after the flop.',
          '- Chasing draws without considering pot odds (covered in Level 3).',
          '- Letting a big loss ("tilt") change your decisions on the very next hand instead of judging each decision on its own.',
        ],
      },
    ],
  },
  {
    id: 'level-3',
    title: 'Level 3 · Poker Mathematics',
    description: 'Outs, probabilities, pot odds, and expected value — the quantitative core this app is built to drill.',
    lessons: [
      {
        id: 'outs',
        title: 'Counting Outs',
        description: 'The unseen cards that turn your hand into the best hand.',
        visual: { kind: 'cards', cards: ['Ah', '4h', 'Kh', '7h', '2c'], caption: 'Four hearts down, nine more still in the deck — a flush draw' },
        blocks: [
          'An "out" is any unseen card that improves your hand to (likely) the best hand.',
          'Example: you hold two hearts, and the flop has two more hearts. You have a flush draw. There are 13 hearts total; 4 are already visible (2 in your hand, 2 on the board), leaving 9 unseen hearts — 9 outs.',
          'Counting outs carefully matters: it’s easy to double-count cards that make a hand which is not actually the best (e.g. a "flush out" that could still lose to a bigger flush or a full house).',
        ],
        check: {
          question: 'You have an open-ended straight draw (e.g. 8-9 with a board of 6-7-K). How many outs do you typically have?',
          options: ['4', '8', '9'],
          correctIndex: 1,
          explanation: 'An open-ended straight draw has 8 outs — 4 ranks on each end (here, any 5 or any 10), 4 suits each.',
        },
      },
      {
        id: 'draw-probabilities',
        title: 'Draw Probabilities & the Rule of 2 and 4',
        description: 'A fast mental shortcut for equity, and the exact math behind it.',
        visual: { kind: 'draw-bar', outs: 9, approx: 36, exact: 34.97 },
        blocks: [
          'The "rule of 2 and 4" is a fast mental APPROXIMATION: multiply your outs by 4 (with two cards to come, i.e. on the flop) or by 2 (with one card to come, i.e. on the turn) to estimate your percentage chance to hit.',
          'It is explicitly an approximation — for a 9-out flush draw it says 36%, while the exact answer is about 35% (close). For very high out counts it overstates equity more noticeably.',
          'The exact method uses the hypergeometric distribution: it directly counts how many ways you can hit at least one out among the remaining unseen cards, with no double counting.',
          'This app always shows both: the fast approximation (labeled as such) and the exact number, so you learn the shortcut without losing sight of the real math.',
        ],
        check: {
          question: 'Using the rule of 4, what is the approximate equity of a 9-out flush draw on the flop?',
          options: ['9%', '18%', '36%'],
          correctIndex: 2,
          explanation: '9 outs × 4 = 36%, a close approximation to the exact ~35% (two cards still to come).',
        },
      },
      {
        id: 'pot-odds',
        title: 'Pot Odds & Required Equity',
        description: 'The exact break-even math behind every call you make.',
        visual: { kind: 'pot-odds', pot: 60, call: 20 },
        blocks: [
          'Pot odds compare the cost of calling to the size of the pot you’d be winning. If it costs 20 to call a pot of 60 (making a 80 pot if you call), you’re getting 3:1 odds.',
          'That translates directly into a required (break-even) equity: call ÷ (pot + call). Here, 20 ÷ (60+20) = 25%. If your real winning chances exceed 25%, calling shows a profit on average.',
          'This required-equity number is EXACT arithmetic — it is not an estimate. What IS uncertain is your actual equity, which usually has to be estimated (from outs, or a range read).',
          'This app always separates these clearly: pot odds / required equity (exact), estimated actual equity (an estimate), and the resulting expected value (a calculation built from both).',
        ],
        check: {
          question: 'The pot is 90 and you must call 30 to continue. What equity do you need to break even?',
          options: ['20%', '25%', '33%', '50%'],
          correctIndex: 1,
          explanation: 'Required equity = call ÷ (pot + call) = 30 ÷ (90 + 30) = 30 ÷ 120 = 25%.',
        },
      },
      {
        id: 'expected-value',
        title: 'Expected Value of Folding, Calling, and Betting',
        description: 'The single number that should drive every decision.',
        blocks: [
          'Expected value (EV) is the probability-weighted average result of a decision. Folding always has EV of exactly 0 (any chips already in the pot are sunk — they’re not "yours" to lose further by folding).',
          'EV of calling = (win probability × pot if you win) − (call amount), accounting for any chance of a split pot.',
          'EV of betting is more complex: it blends "they fold" (you win the current pot) and "they call" (you go to showdown with your real equity) — weighted by how often each happens.',
          'Comparing EV(fold) vs EV(call) vs EV(bet) is the core decision-making tool this whole app is built around. The "right" decision is whichever has the highest EV given your best honest estimates.',
        ],
      },
      {
        id: 'equity-and-combinatorics',
        title: 'Equity vs a Hand, Equity vs a Range, Combinations & Blockers',
        description: 'Thinking in ranges, counting combos, and reading blockers.',
        blocks: [
          '"Equity vs a specific hand" is your win probability against one exact known hand. "Equity vs a range" is your average win probability across all the hands your opponent is likely to hold, weighted by how often each occurs.',
          'A "combination" (combo) is one specific pair of cards, e.g. A♥K♠ is one combo of AK. There are 6 combos of any specific pocket pair, and 16 combos of any specific unpaired two-rank hand (4 suited + 12 offsuit, or split as 4 suited combos + 12 offsuit combos).',
          'A "blocker" is a card in your own hand that reduces the number of combos your opponent can hold of a specific hand. Holding the A♠ makes it impossible for an opponent to hold A♠X, which slightly reduces their strongest bluff-catchers or nutted combos, depending on context.',
        ],
      },
      {
        id: 'implied-odds',
        title: 'Implied Odds, Reverse Implied Odds & Fold Equity',
        description: 'Value beyond this street, risk beyond this hand, and the power of folds.',
        blocks: [
          'Implied odds account for money you expect to win on LATER streets if you hit your draw — they can justify a call that doesn’t quite meet pot odds today, if you expect to get paid more later.',
          'Reverse implied odds are the opposite risk: even if you hit your hand, you might still lose more chips to a bigger hand (e.g. making a small straight into a possible flush).',
          'Fold equity is the value a bet or raise creates purely from the chance your opponent folds — separate from your card equity if they call. It is a major reason bluffing and semi-bluffing can be profitable.',
        ],
      },
      {
        id: 'ev-trees',
        title: 'Expected-Value Trees with Multiple Outcomes',
        description: 'Breaking a messy decision into branches you can actually weigh.',
        blocks: [
          'Real decisions often branch into more than two outcomes: an opponent might fold, call, or raise, each with different probabilities and different resulting EVs.',
          'An EV tree lists every realistic branch, its probability, and its payoff, then sums (probability × payoff) across all branches to get the overall expected value of the initial decision.',
          'This is the same logic used for interview-style probability questions: break a complex decision into mutually exclusive, exhaustive branches, and weight each by its real chance of happening.',
        ],
      },
      {
        id: 'conditional-probability-bayes',
        title: 'Conditional Probability & Bayes’ Theorem',
        description: 'Updating your beliefs correctly as new information arrives — on the felt and in an interview.',
        visual: { kind: 'bayes-update', priorPct: 3, posteriorPct: 37.5, priorLabel: 'Before the 3-bet: P(premium hand)', posteriorLabel: 'After the 3-bet: P(premium hand)' },
        blocks: [
          'Conditional probability asks: given that something is already true, what is the probability of something else? Written P(A | B) — "the probability of A, given B."',
          'In poker this is everywhere without the notation: "given that this player raised from early position, how likely are they to have a big pair?" is a conditional probability question. Every street of new information (a bet, a check, a card) should update your estimate of their range — this is the math behind "hand reading" from Level 5.',
          'Bayes’ theorem gives the exact way to update: P(A | B) = P(B | A) × P(A) ÷ P(B). In words: your updated belief equals your original belief, rescaled by how much more (or less) likely the new evidence is under that belief versus in general.',
          'Worked example: a player 3-bets. Suppose 3-bettors are premium hands (QQ+/AK) 40% of the time and "light" (bluffs/speculative) 60% of the time in this player’s range. You already know 3-betting shows up in about 8% of their hands overall, and premium hands only occur about 3% of the time in their overall range. Given they 3-bet, P(premium | 3-bet) = P(3-bet | premium) × P(premium) ÷ P(3-bet). If they 3-bet with 100% of their premium hands: P(3-bet | premium) = 1.0, P(premium) = 0.03, P(3-bet) = 0.08, so P(premium | 3-bet) = (1.0 × 0.03) ÷ 0.08 = 37.5%. Seeing the 3-bet roughly doubled how likely a premium hand looks, from 3% to 37.5% — large, but still well under half.',
          'The classic interview trap this guards against: a rare, alarming signal (a 3-bet, a positive medical test, a fraud flag) still usually means "still probably not the rare thing" unless the false-positive rate is very low or the signal is very strong. Confusing P(A | B) with P(B | A) — "3-bettors are premium 40% of the time" is NOT the same statement as "premium hands 3-bet 40% of the time" — is one of the most common reasoning errors under time pressure.',
          'This is explicitly one of the most frequently cited topics in quantitative trading interviews (alongside expected value and combinatorics) — practiced here because it is a core transferable skill, not because it is unique to poker.',
        ],
        check: {
          question:
            'This player’s overall range is 30% bluffs and 70% value hands. They bet BIG with a bluff only 20% of the time (they usually bluff small), but bet BIG with value 90% of the time. They just bet BIG. Roughly what is the chance it’s a bluff?',
          options: ['8.7%', '20%', '30%', '69%'],
          correctIndex: 0,
          explanation:
            'P(bluff | big bet) = P(big | bluff) × P(bluff) ÷ P(big bet). P(big bet) = (0.2×0.3) + (0.9×0.7) = 0.06 + 0.63 = 0.69. So P(bluff | big) = 0.06 ÷ 0.69 ≈ 8.7%. The big bet actually makes a bluff LESS likely than the 30% baseline, because this player’s bluffs mostly come in small — a good illustration that Bayes’ theorem can update your read down, not just up.',
        },
      },
    ],
  },
  {
    id: 'level-4',
    title: 'Level 4 · Intermediate Strategy',
    description: 'Ranges, board texture, continuation betting, and reading the shape of a hand rather than just your own two cards.',
    lessons: [
      {
        id: 'preflop-ranges',
        title: 'Preflop Opening Ranges by Position',
        description: 'How the hands worth raising change seat by seat.',
        blocks: [
          'A "range" is the full set of hands a player might hold in a given spot, not just the one hand you’re currently looking at. Strong players think in ranges even about their own play.',
          'Opening ranges (the hands you raise first-in with) widen as position gets later: tightest under-the-gun, progressively wider through middle position, cutoff, and button. The blinds face different pot-odds and closing-the-action considerations.',
          'This is a general shape, not a single "correct" chart — exact ranges depend on stack depth, opponents, and table dynamics, and this app treats any specific range shown as a reasonable illustrative starting point, not gospel.',
        ],
      },
      {
        id: 'threebet-and-multiway',
        title: 'Calling, 3-Betting & Multiway Pots',
        description: 'Re-raising for balance, and adjusting when more players are in.',
        blocks: [
          'A "3-bet" is a re-raise before the flop (the open-raise is the first bet, the blind is technically the "bet" so the raise is the "2-bet"... in practice, "3-bet" just means the first re-raise preflop).',
          '3-betting ranges are usually a mix of very strong hands (for value) and select speculative/blocker hands (as bluffs), rather than every decent hand — calling keeps some strong hands in your calling range too, for balance.',
          'Multiway pots (3+ players) reduce the value of speculative bluffs (more people can wake up with a real hand) and increase the value of hands that make the nuts, compared to heads-up pots.',
        ],
      },
      {
        id: 'board-texture',
        title: 'Board Texture & Range/Nut Advantage',
        description: 'Reading a flop’s shape, and who it favors.',
        visual: {
          kind: 'board-texture',
          boards: [
            { cards: ['Kc', '7c', '2s'], label: 'Dry' },
            { cards: ['9c', '8c', '7h'], label: 'Wet' },
            { cards: ['8c', '8s', '2c'], label: 'Paired' },
            { cards: ['Jc', '7c', '3c'], label: 'Monotone' },
          ],
        },
        blocks: [
          '- Dry board: few draws, disconnected (e.g. K♣7♣2♠) — favors whoever was the preflop aggressor, who usually has more strong hands in their range.',
          '- Wet board: many straight/flush draws (e.g. 9♣8♣7♥) — more hands connect for both players; bet sizing and caution both increase.',
          '- Paired board (e.g. 8♣8♠2♣): reduces the value of two pair, increases the relative value of trips/full houses.',
          '- Monotone board (all one suit): flushes become live for anyone holding two of that suit.',
          'The preflop aggressor often has a "range advantage" (more total equity across their whole range) and/or a "nut advantage" (more very strong hands specifically) on certain textures — this is WHY continuation betting is profitable more often on some boards than others.',
        ],
      },
      {
        id: 'cbetting-and-spr',
        title: 'Continuation Betting, Sizing & Stack-to-Pot Ratio',
        description: 'Betting after the flop on purpose, not out of habit.',
        blocks: [
          'A continuation bet ("c-bet") is a bet by the preflop aggressor after the flop, regardless of whether the flop actually helped their hand — it leans on range advantage and fold equity, not just made-hand strength.',
          'Stack-to-pot ratio (SPR) = effective remaining stack ÷ pot size. Low SPR compresses decisions toward all-in-or-fold; high SPR leaves room for multi-street plans, thin value, and bluffing.',
          'Bet sizing should reflect the goal: smaller sizes with a wide, mixed range on boards that favor you; larger sizes when you want to charge draws heavily or when your range is more polarized (very strong or bluffing, little in between).',
        ],
      },
      {
        id: 'draws-and-thin-value',
        title: 'Drawing Hands, Semi-Bluffs, Thin Value & Bluff-Catching',
        description: 'Four ways to win a pot with a hand that isn’t the nuts yet.',
        blocks: [
          'A "semi-bluff" is betting a hand that isn’t currently best but has strong equity to improve — it can win two ways: immediately (fold equity) or by hitting later (card equity).',
          '"Thin value" means betting a modest made hand for value against a range that includes plenty of worse hands that will still call — profitable, but by a smaller margin than betting a clear best hand.',
          'A "bluff-catcher" is a hand that only beats bluffs, not real value hands — calling with it is a bet purely on your read of how often the opponent is bluffing in that spot.',
          'Reading opponent tendencies (does this player bluff too much? too little? call too wide?) is what turns these categories from abstract theory into concrete, +EV adjustments.',
        ],
      },
    ],
  },
  {
    id: 'level-5',
    title: 'Level 5 · Advanced Competitive Strategy',
    description: 'Range construction, GTO-style balance, exploitative deviations, and reading the game at a higher level.',
    lessons: [
      {
        id: 'range-based-thinking',
        title: 'Range-Based Thinking & Range Shapes',
        description: 'Thinking in whole ranges instead of one hand at a time.',
        blocks: [
          'Strong players evaluate every decision as "my whole range vs. their whole range on this line", not "my one hand vs. their one likely hand". This avoids being results-oriented on any single card.',
          '- A polarized range is split between very strong hands and bluffs, with few medium hands — common on big bets/raises.',
          '- A merged (or "linear") range is mostly medium-to-strong hands with few outright bluffs — common on smaller, more frequent bets.',
          '- A condensed range is capped below the very best hands (e.g. after just calling earlier streets) — it can still be strong, but rarely the nuts.',
        ],
      },
      {
        id: 'mdf-and-ratios',
        title: 'Minimum Defence Frequency & Bluff-to-Value Ratios',
        description: 'The defence rate and bluff ratios that keep you unexploitable.',
        blocks: [
          'Minimum defence frequency (MDF) is the minimum fraction of your range you must continue with (call or raise) against a bet, so the bettor cannot profit by bluffing every single hand: MDF = pot ÷ (pot + bet).',
          'The matching idea for the bettor: to make opponents theoretically indifferent to calling a bluff, aim for roughly 1 bluff combo for every 2 value combos on a pot-sized bet (the exact ratio shifts with bet size) — this is a simplified toy-game result, not a guarantee for any specific real hand.',
          'These numbers describe a theoretically balanced, hard-to-exploit baseline. Real opponents deviate from it constantly — which is exactly what creates room for exploitative adjustments (next lesson).',
        ],
      },
      {
        id: 'gto-vs-exploitative',
        title: 'GTO Concepts vs. Exploitative Adjustments',
        description: 'Playing unexploitably versus attacking a specific opponent.',
        blocks: [
          'A game-theory-optimal (GTO) style strategy aims to be unexploitable — it does well against any counter-strategy, including a perfect opponent, but doesn’t maximally punish a flawed one.',
          'An exploitative strategy deliberately deviates from balance to attack a specific tendency (e.g. over-folding, over-bluffing, calling too loosely) — it can win much more against that specific opponent, but can be counter-exploited if they adjust.',
          'Neither is "more correct" in the abstract — this app labels every recommendation clearly as one or the other, and is explicit that real strategy is often mixed and assumption-dependent, not a single unique right answer.',
        ],
      },
      {
        id: 'multistreet-and-blockers',
        title: 'Multi-Street Range Construction, Bet Sizing & Blockers',
        description: 'Building a credible story for your hand across three streets.',
        blocks: [
          'A range built on one street constrains what is credible on later streets — planning a bluff means asking whether your story (the sequence of bets) is one your actual value range would also tell.',
          'Bet-size selection itself carries information in a balanced strategy: mixing sizes, or committing to one size with a wide range, are both legitimate structures depending on the situation.',
          'Blockers matter more on later streets and bigger decisions: holding a card that removes some of an opponent’s strongest continues (or their best bluffs) shifts the math of a marginal call, raise, or bluff.',
        ],
      },
      {
        id: 'hand-reading-and-adjustments',
        title: 'Hand Reading, Population Tendencies & Stack/Format Adjustments',
        description: 'Narrowing an opponent’s range, and adjusting for stack depth.',
        blocks: [
          'Hand reading narrows an opponent’s range street by street using their actual actions, position, and sizing — not just their two final cards, which you rarely see.',
          '"Population tendencies" are common deviations across typical opponents (e.g. under-bluffing rivers, over-valuing top pair) — useful defaults before you have a specific read on this particular opponent.',
          'Heads-up play widens ranges dramatically (far fewer hands to fold to). Deep stacks reward more multi-street planning and implied odds; short stacks compress decisions toward simpler shove/fold math.',
          'Tournament-specific concepts — ICM, escalating blinds, push/fold charts — are intentionally kept out of this core curriculum; they are listed in the project backlog as a later, optional module, since this app focuses on transferable cash-game reasoning.',
        ],
      },
    ],
  },
];

export function findLesson(levelId: string, lessonId: string): { level: Level; lesson: Lesson } | null {
  const level = CURRICULUM.find((l) => l.id === levelId);
  if (!level) return null;
  const lesson = level.lessons.find((l) => l.id === lessonId);
  if (!lesson) return null;
  return { level, lesson };
}

export function totalLessonCount(): number {
  return CURRICULUM.reduce((sum, l) => sum + l.lessons.length, 0);
}
