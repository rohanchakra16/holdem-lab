import { Card } from '../engine/cards';
import { ActionRecord, ShowdownResult, TableConfig } from '../engine/types';

export interface HandHistoryPlayerSnapshot {
  id: string;
  name: string;
  isHuman: boolean;
  seat: number;
  startingStack: number;
  endingStack: number;
  holeCards: Card[]; // only populated for hero, or for anyone who reached showdown
}

export interface HandHistoryEntry {
  id: string;
  handNumber: number;
  timestamp: number;
  config: TableConfig;
  buttonSeat: number;
  players: HandHistoryPlayerSnapshot[];
  community: Card[];
  actionHistory: ActionRecord[];
  showdownResults: ShowdownResult[] | null;
  heroId: string;
  heroNetResult: number;
  notes: string;
  mode: 'guided' | 'free';
}
