import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ClockIcon, HomeIcon, SlidersIcon, UserIcon } from "./icons";

const NAV_ITEMS = [
  { to: "/", key: "nav.home", end: true, Icon: HomeIcon },
  { to: "/profiles", key: "nav.profiles", end: false, Icon: UserIcon },
  { to: "/working-hours", key: "nav.workingHours", end: false, Icon: ClockIcon },
  { to: "/settings", key: "nav.settings", end: false, Icon: SlidersIcon },
] as const;

/** Always a slim icon-only rail (no expand/collapse toggle). Floats as a
 * transparent overlay over the content (positioned below the title bar,
 * full remaining height) - see AppShell for why it isn't a layout sibling
 * that reserves horizontal space. */
export default function Sidebar() {
  const { t } = useTranslation();
  return (
    <nav className="absolute left-0 top-9 bottom-0 flex w-14 flex-col gap-1 bg-transparent p-3">
      {NAV_ITEMS.map(({ to, key, end, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          title={t(key)}
          className={({ isActive }) =>
            `flex items-center justify-center rounded px-0 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-bronze text-surface-50"
                : "text-ink/80 hover:bg-surface-50/60 hover:text-ink"
            }`
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
        </NavLink>
      ))}
    </nav>
  );
}
