import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronIcon,
  ClockIcon,
  HomeIcon,
  SlidersIcon,
  UserIcon,
} from "./icons";

const NAV_ITEMS = [
  { to: "/", key: "nav.home", end: true, Icon: HomeIcon },
  { to: "/profiles", key: "nav.profiles", end: false, Icon: UserIcon },
  { to: "/working-hours", key: "nav.workingHours", end: false, Icon: ClockIcon },
  { to: "/settings", key: "nav.settings", end: false, Icon: SlidersIcon },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/** Floats as a transparent overlay over the content (positioned below the
 * title bar, full remaining height) - see AppShell for why it isn't a
 * layout sibling that reserves horizontal space. */
export default function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const { t } = useTranslation();
  return (
    <nav
      className={`absolute left-0 top-9 bottom-0 flex flex-col gap-1 bg-transparent p-3 transition-[width] duration-150 ${
        collapsed ? "w-14" : "w-44"
      }`}
    >
      {NAV_ITEMS.map(({ to, key, end, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          title={collapsed ? t(key) : undefined}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
              collapsed ? "justify-center px-0" : ""
            } ${
              isActive
                ? "bg-bronze text-surface-50"
                : "text-ink/80 hover:bg-surface-50/60 hover:text-ink"
            }`
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t(key)}</span>}
        </NavLink>
      ))}

      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={
          collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")
        }
        title={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
        className="mt-auto flex items-center justify-center rounded px-3 py-2 text-ink/60 hover:bg-surface-50/60 hover:text-ink"
      >
        <ChevronIcon
          className="h-5 w-5 shrink-0"
          direction={collapsed ? "right" : "left"}
        />
      </button>
    </nav>
  );
}
