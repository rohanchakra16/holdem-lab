import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import clsx from 'clsx';
import { useProgressStore } from './state/progressStore';
import { CURRICULUM, totalLessonCount } from './training/curriculum/data';
import { Icon, NavIconName } from './components/common/NavIcons';
import { SuitIcon } from './components/common/SuitIcon';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import LessonView from './pages/LessonView';
import Play from './pages/Play';
import Drills from './pages/Drills';
import RapidDecision from './pages/RapidDecision';
import HandReview from './pages/HandReview';
import Reference from './pages/Reference';
import Onboarding from './pages/Onboarding';

const NAV_ITEMS: { to: string; label: string; icon: NavIconName }[] = [
  { to: '/', label: 'Progress', icon: 'dashboard' },
  { to: '/learn', label: 'Learn', icon: 'learn' },
  { to: '/play', label: 'Play', icon: 'play' },
  { to: '/drills', label: 'Drills', icon: 'drills' },
  { to: '/rapid-decision', label: 'Rapid Decision', icon: 'timer' },
  { to: '/history', label: 'Hand Review', icon: 'history' },
  { to: '/reference', label: 'Tools', icon: 'reference' },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)] bg-felt-800 ring-1 ring-felt-600/50">
        <SuitIcon suit="s" size={15} className="text-ivory-100" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-[15px] font-semibold text-ivory-100">Holdem Lab</div>
        <div className="text-[10.5px] text-sand-500">Poker &amp; probability training</div>
      </div>
    </div>
  );
}

function ProgressPip() {
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const total = totalLessonCount();
  const pct = Math.round((completedLessons.length / total) * 100);
  const levelIndex = CURRICULUM.findIndex((lvl) => lvl.lessons.some((l) => !completedLessons.includes(`${lvl.id}/${l.id}`)));
  const currentLevel = levelIndex === -1 ? CURRICULUM.length : levelIndex + 1;

  return (
    <NavLink to="/learn" className="group flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 hover:bg-ink-800/70">
      <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0 -rotate-90">
        <circle cx="14" cy="14" r="11" fill="none" stroke="var(--color-ink-700)" strokeWidth="3" />
        <circle
          cx="14"
          cy="14"
          r="11"
          fill="none"
          stroke="var(--color-brass-500)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 69.1} 69.1`}
        />
      </svg>
      <div className="leading-tight">
        <div className="text-[11px] font-semibold text-sand-200">Level {currentLevel} of {CURRICULUM.length}</div>
        <div className="tabular text-[10.5px] text-sand-500">{pct}% complete</div>
      </div>
    </NavLink>
  );
}

function Sidebar() {
  return (
    <nav className="hidden md:flex w-60 shrink-0 flex-col border-r border-ink-800/80 bg-ink-900 py-5 px-3">
      <div className="px-2 pb-6">
        <BrandMark />
      </div>
      <div className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'group flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-[13.5px] font-medium transition-colors duration-[var(--duration-fast)]',
                isActive ? 'bg-felt-800/50 text-ivory-100' : 'text-sand-400 hover:bg-ink-800/70 hover:text-sand-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={clsx('flex h-4 w-4 items-center justify-center', isActive ? 'text-felt-300' : 'text-sand-500 group-hover:text-sand-300')}>
                  <Icon name={item.icon} size={17} />
                </span>
                {item.label}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brass-400" />}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <div className="h-px bg-ink-800" />
        <ProgressPip />
        <p className="px-2.5 text-[10.5px] leading-snug text-sand-600">
          Fictional chips only. Educational tool for probability &amp; decision-making practice — not real-money gambling.
        </p>
      </div>
    </nav>
  );
}

function MobileTabBar() {
  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-800 bg-ink-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            clsx('flex flex-1 flex-col items-center gap-0.5 py-2 text-[9.5px] font-medium', isActive ? 'text-felt-300' : 'text-sand-500')
          }
        >
          <Icon name={item.icon} size={18} />
          <span className="truncate max-w-[52px]">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  const onboardingComplete = useProgressStore((s) => s.onboardingComplete);

  if (!onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:levelId/:lessonId" element={<LessonView />} />
            <Route path="/play" element={<Play />} />
            <Route path="/drills" element={<Drills />} />
            <Route path="/rapid-decision" element={<RapidDecision />} />
            <Route path="/history" element={<HandReview />} />
            <Route path="/reference" element={<Reference />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
