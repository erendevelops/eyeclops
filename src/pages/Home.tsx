import { useTranslation } from "react-i18next";
import CircularTimer from "../components/CircularTimer";
import { useAppData } from "../context/AppDataContext";
import { buttonClass } from "../styles";

/** The page shown when opening EyeClops from the tray: just the sundial
 * timer, current profile, and pause/resume — nothing else. */
export default function Home() {
  const { t } = useTranslation();
  const { config, paused, timerStatus, togglePause } = useAppData();

  if (!config) {
    return null;
  }

  const activeProfile = config.profiles.find(
    (p) => p.id === config.activeProfileId,
  );

  return (
    // `fixed` anchors to the actual window, not the padded content
    // wrapper AppShell gives other pages - so the timer stays centered on
    // the true window regardless of the sidebar's width or state.
    <main className="fixed inset-0 flex flex-col items-center justify-center gap-4">
      <CircularTimer
        status={timerStatus}
        offDutyLabel={t("settings.status.offDuty")}
        pausedLabel={t("settings.status.paused")}
        ariaLabel={t("settings.status.timerAriaLabel")}
        remainingCaption={t("settings.status.untilBreak")}
        onBreakLabel={t("settings.status.onBreak")}
      />
      <p className="text-sm text-ink/80">
        {t("settings.status.activeProfile")}:{" "}
        <strong>{activeProfile?.name ?? "-"}</strong>
      </p>
      <button className={buttonClass} onClick={togglePause}>
        {paused ? t("settings.status.resume") : t("settings.status.pause")}
      </button>
    </main>
  );
}
