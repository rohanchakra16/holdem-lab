import { describe, it, expect } from 'vitest';
import { combinations, factorial, holeCardCombinations } from './combinatorics';
import { requiredEquityToCall, potOddsRatio, stackToPotRatio, betSizeFromPreset } from './potOdds';
import { ruleOfTwoAndFour, exactOutsEquity, unseenCardCount } from './outs';
import { evOfCall, evOfBet, breakEvenBluffFoldFrequency, EV_OF_FOLD } from './ev';
import { equityVsRandomHands, equityVsSpecificHand } from './equity';
import { parseCard } from '../engine/cards';
import { mulberry32 } from '../engine/rng';

function cards(str: string) {
  return str.split(' ').map(parseCard);
}

describe('combinatorics', () => {
  it('computes factorial', () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(5)).toBe(120);
  });

  it('computes n choose k', () => {
    expect(combinations(52, 5)).toBe(2598960); // total 5-card poker hands
    expect(combinations(4, 2)).toBe(6); // ways to pick 2 suits worth of a pair, etc.
    expect(combinations(5, 0)).toBe(1);
    expect(combinations(5, 6)).toBe(0);
  });

  it('computes hole card combinations for pocket pairs vs unpaired hands', () => {
    expect(holeCardCombinations(4, 4, true)).toBe(combinations(4, 2)); // 6 combos of a specific pocket pair
    expect(holeCardCombinations(4, 4, false)).toBe(16); // 4x4 = 16 combos of two specific unpaired ranks
  });
});

describe('pot odds', () => {
  it('computes exact required equity to call', () => {
    // Pot is 100, call is 50 -> need 50/150 = 33.3%
    expect(requiredEquityToCall(100, 50)).toBeCloseTo(1 / 3, 5);
  });

  it('returns 0 required equity when there is nothing to call', () => {
    expect(requiredEquityToCall(100, 0)).toBe(0);
  });

  it('expresses pot odds as a ratio', () => {
    expect(potOddsRatio(100, 50).potToOne).toBe(2);
  });

  it('computes stack-to-pot ratio', () => {
    expect(stackToPotRatio(300, 100)).toBe(3);
  });

  it('derives bet size presets relative to pot, capped by the effective stack', () => {
    expect(betSizeFromPreset('half', 100, 1000)).toBe(50);
    expect(betSizeFromPreset('pot', 100, 1000)).toBe(100);
    expect(betSizeFromPreset('pot', 100, 60)).toBe(60); // capped by short stack
    expect(betSizeFromPreset('allIn', 100, 240)).toBe(240);
  });
});

describe('outs and draw probabilities', () => {
  it('rule of 4 approximates equity with two cards to come', () => {
    expect(ruleOfTwoAndFour(9, 2)).toBe(36); // classic flush draw ~36% (approx)
  });

  it('rule of 2 approximates equity with one card to come', () => {
    expect(ruleOfTwoAndFour(9, 1)).toBe(18);
  });

  it('caps the rule-of-4 approximation at 100%', () => {
    expect(ruleOfTwoAndFour(30, 2)).toBe(100);
  });

  it('computes the exact equity for a flush draw with two cards to come (~35%)', () => {
    // 9 outs, 47 unseen, 2 cards to come. Known exact value ~34.97%.
    const exact = exactOutsEquity(9, 47, 2);
    expect(exact).toBeGreaterThan(0.34);
    expect(exact).toBeLessThan(0.36);
  });

  it('computes the exact equity for an open-ended straight draw with one card to come (~17.4%)', () => {
    const exact = exactOutsEquity(8, 46, 1);
    expect(exact).toBeCloseTo(8 / 46, 5);
  });

  it('the rule of 4 modestly overstates exact equity for large out counts', () => {
    const approx = ruleOfTwoAndFour(15, 2) / 100;
    const exact = exactOutsEquity(15, 47, 2);
    expect(approx).toBeGreaterThan(exact);
  });

  it('computes unseen card counts correctly', () => {
    expect(unseenCardCount(0)).toBe(50); // preflop, only hero's 2 hole cards seen
    expect(unseenCardCount(3)).toBe(47); // flop
    expect(unseenCardCount(4)).toBe(46); // turn
  });
});

describe('expected value', () => {
  it('folding always has EV 0', () => {
    expect(EV_OF_FOLD).toBe(0);
  });

  it('computes EV of a call with no ties', () => {
    // Pot before call = 100, call = 50, win% = 40% -> EV = 0.4*150 - 50 = 10
    const ev = evOfCall({ potBeforeCall: 100, callAmount: 50, winProbability: 0.4 });
    expect(ev).toBeCloseTo(10, 5);
  });

  it('matches break-even exactly at the required-equity threshold', () => {
    const required = requiredEquityToCall(100, 50); // 1/3
    const ev = evOfCall({ potBeforeCall: 100, callAmount: 50, winProbability: required });
    expect(ev).toBeCloseTo(0, 5);
  });

  it('accounts for split-pot ties in call EV', () => {
    const ev = evOfCall({ potBeforeCall: 100, callAmount: 50, winProbability: 0, tieProbability: 1, tiedWithCount: 2 });
    // Guaranteed chop: get back half of the 150 pot = 75, cost 50 -> EV = 25
    expect(ev).toBeCloseTo(25, 5);
  });

  it('computes EV of a bet using fold equity plus showdown equity when called', () => {
    const ev = evOfBet({ potBeforeBet: 100, betAmount: 50, foldProbability: 0.5, winProbabilityIfCalled: 0.4 });
    // fold: 0.5*100=50; called: 0.5*(0.4*200 - 0.6*50)=0.5*(80-30)=25; total=75
    expect(ev).toBeCloseTo(75, 5);
  });

  it('computes the break-even fold frequency for a pure bluff', () => {
    // Bet pot-sized (100 into 100): need opponent to fold at least 50% of the time.
    expect(breakEvenBluffFoldFrequency(100, 100)).toBeCloseTo(0.5, 5);
  });
});

describe('Monte Carlo equity (simulation, seeded for determinism)', () => {
  it('gives a big favorite roughly the expected equity range: AA vs random hand preflop', () => {
    const hero = cards('Ac Ad');
    const result = equityVsRandomHands(hero, [], 1, 4000, mulberry32(1));
    // AA vs a random hand is roughly 85% equity heads-up.
    expect(result.winRate + result.tieRate).toBeGreaterThan(0.78);
    expect(result.winRate + result.tieRate).toBeLessThan(0.92);
  });

  it('gives roughly 50/50 for two random-ish hands with a shared coinflip setup (AKo vs QQ ~ 50/50)', () => {
    const hero = cards('Ac Kd');
    const villain = cards('Qh Qs');
    const result = equityVsSpecificHand(hero, villain, [], 6000, mulberry32(2));
    expect(result.winRate).toBeGreaterThan(0.42);
    expect(result.winRate).toBeLessThan(0.58);
  });

  it('gives a made hand on the river a deterministic (0 or 1) result since no cards remain to come', () => {
    const hero = cards('Ac Ad');
    const villain = cards('Kc Kd');
    const board = cards('Ah 7c 2d 9s 3h'); // hero has trip aces, clear winner
    const result = equityVsSpecificHand(hero, villain, board, 100, mulberry32(3));
    expect(result.winRate).toBe(1);
    expect(result.loseRate).toBe(0);
  });
});
