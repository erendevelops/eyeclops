import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useAppData } from "../context/AppDataContext";
import type { SupportedLanguage } from "../i18n";
import { buttonClass, headingClass, inputClass, sectionClass } from "../styles";

/** General app settings: brightness/color-temp tips, launch-at-startup,
 * and language. Break schedules and working hours have their own pages. */
export default function Settings() {
  const { t } = useTranslation();
  const {
    config,
    setLanguage,
    toggleBrightnessTips,
    toggleLaunchAtStartup,
    toggleFullscreenOverlay,
  } = useAppData();

  if (!config) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <h1 className="mb-2 text-2xl font-bold text-ink">{t("settings.title")}</h1>

      <section className={sectionClass}>
        <h2 className={headingClass}>{t("settings.overlay.title")}</h2>
        <label className="mb-1 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={config.fullscreenOverlayEnabled}
            onChange={(e) => toggleFullscreenOverlay(e.target.checked)}
          />
          {t("settings.overlay.enabled")}
        </label>
        <p className="text-sm text-ink/70">{t("settings.overlay.disabledHint")}</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>{t("settings.brightness.title")}</h2>
        <label className="mb-2 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={config.brightnessTips.enabled}
            onChange={(e) => toggleBrightnessTips(e.target.checked)}
          />
          {t("settings.brightness.enabled")}
        </label>
        <p className="mb-2 text-sm text-ink/70">
          {t("settings.brightness.scheduleSunset")}
        </p>
        <button className={buttonClass} onClick={() => api.openDisplaySettings()}>
          {t("settings.brightness.openOsSettings")}
        </button>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>{t("settings.startup.title")}</h2>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={config.launchAtStartup}
            onChange={(e) => toggleLaunchAtStartup(e.target.checked)}
          />
          {t("settings.startup.launchAtStartup")}
        </label>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>{t("settings.language.title")}</h2>
        <select
          className={inputClass}
          value={config.language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
        >
          <option value="en">{t("settings.language.en")}</option>
          <option value="tr">{t("settings.language.tr")}</option>
        </select>
      </section>
    </main>
  );
}
