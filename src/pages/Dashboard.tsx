import { Link } from 'react-router-dom';
import { useProgressStore } from '../state/progressStore';
import { CURRICULUM, totalLessonCount } from '../training/curriculum/data';
import { ALL_CATEGORIES } from '../training/drills/generators';
import { loadHandHistory } from '../handHistory/handHistoryStore';
import { Badge, Panel, ProgressBar, StatTile } from '../components/common/ui';
import { PageHeading } from '../components/common/PageHeading';

function recommendedLesson(completed: string[]) {
  for (const level of CURRICULUM) {
    for (const lesson of level.lessons) {
      const key = `${level.id}/${lesson.id}`;
      if (!completed.includes(key)) return { level, lesson };
    }
  }
  return null;
}

export default function Dashboard() {
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const drillStats = useProgressStore((s) => s.drillStats);
  const chipHistory = useProgressStore((s) => s.chipHistory);
  const mistakeLog = useProgressStore((s) => s.mistakeLog);

  const totalLessons = totalLessonCount();
  const curriculumPct = (completedLessons.length / totalLessons) * 100;
  const recommended = recommendedLesson(completedLessons);
  const hands = loadHandHistory().slice(0, 6);
  const netChips = chipHistory.reduce((sum, h) => sum + h.delta, 0);

  const potOdds = drillStats['pot-odds'];
  const callEv = drillStats['call-ev'];
  const betEv = drillStats['bet-ev-fold-equity'];
  const preflop = drillStats['preflop-decision'];
  const evCombined = {
    attempts: (callEv?.attempts ?? 0) + (betEv?.attempts ?? 0),
    correct: (callEv?.correct ?? 0) + (betEv?.correct ?? 0),
    totalResponseMs: (callEv?.totalResponseMs ?? 0) + (betEv?.totalResponseMs ?? 0),
  };

  const totalDrillAttempts = Object.values(drillStats).reduce((s, v) => s + v.attempts, 0);
  const totalDrillResponseMs = Object.values(drillStats).reduce((s, v) => s + v.totalResponseMs, 0);
  const avgResponseSec = totalDrillAttempts > 0 ? totalDrillResponseMs / totalDrillAttempts / 1000 : 0;

  const mistakeCounts = new Map<string, number>();
  for (const m of mistakeLog) mistakeCounts.set(m.category, (mistakeCounts.get(m.category) ?? 0) + 1);
  const topMistakes = [...mistakeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-8">
      <PageHeading
        title="Progress Dashboard"
        subtitle="Tracking learning, not just fictional winnings. Short-term chip results carry heavy variance — treat P&L as one signal among many, not proof of decision quality."
      />

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Curriculum" value={`${completedLessons.length}/${totalLessons}`} sub={`${curriculumPct.toFixed(0)}% complete`} />
        <StatTile
          label="Pot Odds Accuracy"
          value={potOdds ? `${((potOdds.correct / potOdds.attempts) * 100).toFixed(0)}%` : '—'}
          sub={potOdds ? `${potOdds.attempts} attempts` : 'no attempts yet'}
        />
        <StatTile
          label="EV Calc Accuracy"
          value={evCombined.attempts ? `${((evCombined.correct / evCombined.attempts) * 100).toFixed(0)}%` : '—'}
          sub={evCombined.attempts ? `${evCombined.attempts} attempts` : 'no attempts yet'}
        />
        <StatTile
          label="Preflop Accuracy"
          value={preflop ? `${((preflop.correct / preflop.attempts) * 100).toFixed(0)}%` : '—'}
          sub={preflop ? `${preflop.attempts} attempts` : 'no attempts yet'}
        />
        <StatTile label="Avg Drill Response Time" value={totalDrillAttempts ? `${avgResponseSec.toFixed(1)}s` : '—'} />
        <StatTile
          label="Fictional Chip P&amp;L"
          value={<span className={netChips >= 0 ? 'text-felt-300' : 'text-burgundy-400'}>{netChips >= 0 ? '+' : ''}{netChips}</span>}
          sub="high variance — not a reliable skill measure short-term"
        />
        <StatTile label="Hands Played" value={loadHandHistory().length} />
        <StatTile label="Mistakes Logged" value={mistakeLog.length} />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <Panel title="Curriculum Progress">
          <ProgressBar value={curriculumPct} />
          {recommended ? (
            <div className="mt-3 rounded-lg bg-ink-800/60 p-3">
              <div className="text-xs text-sand-500">Recommended next lesson</div>
              <div className="text-sm font-semibold text-sand-100">{recommended.lesson.title}</div>
              <Link to={`/learn/${recommended.level.id}/${recommended.lesson.id}`} className="mt-2 inline-block text-xs text-felt-300 hover:underline">
                Continue →
              </Link>
            </div>
          ) : (
            <div className="mt-3 text-sm text-felt-300">Curriculum complete!</div>
          )}
        </Panel>

        <Panel title="Accuracy by Drill Category">
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
            {ALL_CATEGORIES.map((c) => {
              const stat = drillStats[c.id];
              const pct = stat ? (stat.correct / stat.attempts) * 100 : null;
              return (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className="text-sand-400">{c.label}</span>
                  <span className={pct === null ? 'text-sand-600' : pct >= 70 ? 'text-felt-300' : pct >= 40 ? 'text-brass-400' : 'text-burgundy-400'}>
                    {pct === null ? 'no data' : `${pct.toFixed(0)}% (${stat!.attempts})`}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Frequently Repeated Mistakes">
          {topMistakes.length === 0 ? (
            <div className="text-sm text-sand-500">No mistakes logged yet.</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {topMistakes.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-sand-300">{cat}</span>
                  <Badge tone="warn">{count}×</Badge>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recent Hands">
          {hands.length === 0 ? (
            <div className="text-sm text-sand-500">
              No hands yet — <Link to="/play" className="text-felt-300">play a session</Link>.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {hands.map((h) => (
                <Link key={h.id} to="/history" className="flex items-center justify-between rounded-md bg-ink-800/50 px-3 py-1.5 text-sm hover:bg-ink-800">
                  <span className="text-sand-300">Hand #{h.handNumber}</span>
                  <span className={h.heroNetResult >= 0 ? 'text-felt-300' : 'text-burgundy-400'}>
                    {h.heroNetResult > 0 ? '+' : ''}
                    {h.heroNetResult}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
