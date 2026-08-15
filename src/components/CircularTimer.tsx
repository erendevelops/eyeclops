import type { TimerStatus } from "../types";

interface CircularTimerProps {
  status: TimerStatus | null;
  offDutyLabel: string;
  pausedLabel: string;
  ariaLabel: string;
  /** Small caption shown under the countdown while running, e.g. "time left". */
  remainingCaption: string;
}

function formatRemaining(elapsedSecs: number, intervalSecs: number): string {
  const remaining = Math.max(0, intervalSecs - elapsedSecs);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const RADIUS = 85;
const CENTER = 100;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Modern circular progress-ring timer: a thin track plus a bronze arc
 * that fills clockwise as the break approaches, with the countdown (or a
 * paused/off-duty label) centered inside. */
export default function CircularTimer({
  status,
  offDutyLabel,
  pausedLabel,
  ariaLabel,
  remainingCaption,
}: CircularTimerProps) {
  if (!status) {
    return null;
  }

  const { elapsedSecs, intervalSecs, paused, onDuty } = status;
  const progress = intervalSecs > 0 ? Math.min(1, elapsedSecs / intervalSecs) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const dimmed = paused || !onDuty;
  const label = !onDuty ? offDutyLabel : paused ? pausedLabel : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-56 w-56">
        <svg
          viewBox="0 0 200 200"
          className={`h-56 w-56 -rotate-90 transition-opacity ${dimmed ? "opacity-40" : "opacity-100"}`}
          role="img"
          aria-label={ariaLabel}
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            className="stroke-surface-200"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            className="stroke-bronze transition-[stroke-dashoffset] duration-1000 ease-linear"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-2xl font-semibold text-ink">
            {label ?? formatRemaining(elapsedSecs, intervalSecs)}
          </span>
          {!label && (
            <span className="text-xs uppercase tracking-wide text-ink/60">
              {remainingCaption}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
