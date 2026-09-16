import type { CoachFeedback } from '../../training/coach';
import { Badge } from '../common/ui';
import { Icon } from '../common/NavIcons';

export function CoachPanel({ feedback, onDismiss }: { feedback: CoachFeedback; onDismiss: () => void }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-ink-850 ring-1 ring-brass-500/25 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-sand-200">
          <span className="text-brass-400">
            <Icon name="reference" size={14} />
          </span>
          Coach feedback
        </div>
        <button onClick={onDismiss} className="text-[11px] text-sand-600 hover:text-sand-300">
          Dismiss ✕
        </button>
      </div>
      <div className="flex flex-col gap-3 px-4 pb-4 text-sm">
        <div className="flex items-center gap-2">
          <Badge tone={feedback.isLegal ? 'good' : 'bad'}>{feedback.isLegal ? 'Legal action' : 'Illegal action'}</Badge>
          {feedback.isImportantDecision && <Badge tone="warn">Important decision</Badge>}
        </div>
        <p className="text-[13.5px] leading-relaxed text-sand-200">{feedback.assessment}</p>

        {(feedback.requiredEquity !== null || feedback.estimatedEquity !== null) && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {feedback.requiredEquity !== null && <Stat label="Required equity (exact)" value={`${(feedback.requiredEquity * 100).toFixed(1)}%`} />}
            {feedback.estimatedEquity !== null && <Stat label="Estimated equity (sim.)" value={`${(feedback.estimatedEquity * 100).toFixed(1)}%`} />}
            {feedback.evOfCalling !== null && <Stat label="EV of calling" value={feedback.evOfCalling.toFixed(1)} />}
            <Stat label="SPR" value={Number.isFinite(feedback.stackToPotRatio) ? feedback.stackToPotRatio.toFixed(1) : '∞'} />
          </div>
        )}

        <div className="text-[12px] text-sand-500">
          Position: <span className="text-sand-300">{feedback.positionNote}</span> · Effective stack:{' '}
          <span className="tabular text-sand-300">{feedback.effectiveStack}</span>
        </div>

        {feedback.lesson && (
          <div className="rounded-[var(--radius-sm)] bg-felt-900/40 p-2.5 text-[12.5px] text-sand-300 ring-1 ring-felt-700/30">
            <span className="font-semibold text-felt-300">Lesson: </span>
            {feedback.lesson}
          </div>
        )}

        <div className="rounded-[var(--radius-sm)] bg-burgundy-900/20 p-2.5 text-[11.5px] text-burgundy-200/90 ring-1 ring-burgundy-700/30">
          {feedback.outcomeNote}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-xs)] bg-ink-800 px-2.5 py-1.5">
      <div className="text-[9.5px] uppercase tracking-wide text-sand-600">{label}</div>
      <div className="tabular text-[13.5px] font-semibold text-sand-100">{value}</div>
    </div>
  );
}
