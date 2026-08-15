// Small hand-drawn icon set for the sidebar nav — kept minimal (stroke-only,
// 24x24 viewBox) so we don't need an icon library dependency for four glyphs.

type IconProps = { className?: string };

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 11.5 12 4l8 7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v9h5v-5h2v5h5v-9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 20c1.2-3.8 4.2-6 7-6s5.8 2.2 7 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SlidersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {[
        { y: 6, knob: 15 },
        { y: 12, knob: 9 },
        { y: 18, knob: 13 },
      ].map(({ y, knob }) => (
        <g key={y}>
          <line
            x1="4"
            y1={y}
            x2="20"
            y2={y}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx={knob} cy={y} r="2" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

export function ChevronIcon({
  className,
  direction = "left",
}: IconProps & { direction?: "left" | "right" }) {
  const points = direction === "left" ? "14 6 8 12 14 18" : "10 6 16 12 10 18";
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <polyline
        points={points}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
