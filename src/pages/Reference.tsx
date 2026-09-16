import { useState } from 'react';
import { PotOddsCalculator } from '../components/calculators/PotOddsCalculator';
import { OutsCalculator } from '../components/calculators/OutsCalculator';
import { EquityCalculator } from '../components/calculators/EquityCalculator';
import { EvCalculator } from '../components/calculators/EvCalculator';
import { CombinationsCalculator } from '../components/calculators/CombinationsCalculator';
import { StartingHandMatrix } from '../components/calculators/StartingHandMatrix';
import { BetSizingVisualizer } from '../components/calculators/BetSizingVisualizer';
import { HandRankingsReference, PositionReference, Glossary } from '../components/calculators/StaticReference';
import { PageHeading } from '../components/common/PageHeading';

const TABS = [
  { id: 'rankings', label: 'Hand Rankings' },
  { id: 'pot-odds', label: 'Pot Odds' },
  { id: 'outs', label: 'Outs' },
  { id: 'equity', label: 'Equity' },
  { id: 'ev', label: 'Expected Value' },
  { id: 'combinations', label: 'Combinations' },
  { id: 'matrix', label: 'Starting Hands' },
  { id: 'position', label: 'Position' },
  { id: 'sizing', label: 'Bet Sizing' },
  { id: 'glossary', label: 'Glossary' },
] as const;

export default function Reference() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('pot-odds');

  return (
    <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8 sm:py-8">
      <PageHeading title="Reference & Calculators" subtitle="Every calculator shows its formula and reasoning, not just a final number." />

      <div className="mt-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-[var(--radius-xs)] px-2.5 py-1.5 text-[11.5px] font-medium transition-colors ${tab === t.id ? 'bg-felt-600 text-ivory-100' : 'bg-ink-800 text-sand-400 hover:bg-ink-700 hover:text-sand-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'rankings' && <HandRankingsReference />}
        {tab === 'pot-odds' && <PotOddsCalculator />}
        {tab === 'outs' && <OutsCalculator />}
        {tab === 'equity' && <EquityCalculator />}
        {tab === 'ev' && <EvCalculator />}
        {tab === 'combinations' && <CombinationsCalculator />}
        {tab === 'matrix' && <StartingHandMatrix />}
        {tab === 'position' && <PositionReference />}
        {tab === 'sizing' && <BetSizingVisualizer />}
        {tab === 'glossary' && <Glossary />}
      </div>
    </div>
  );
}
