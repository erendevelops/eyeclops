import { useTranslation } from "react-i18next";
import { useAppData } from "../context/AppDataContext";
import { inputClass, labelClass, sectionClass } from "../styles";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export default function WorkingHoursPage() {
  const { t } = useTranslation();
  const { config, updateWorkingHours, toggleWorkingDay } = useAppData();

  if (!config) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-ink">
        {t("settings.workingHours.title")}
      </h1>
      <section className={sectionClass}>
        <label className="mb-3 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={config.workingHours.enabled}
            onChange={(e) => updateWorkingHours({ enabled: e.target.checked })}
          />
          {t("settings.workingHours.enabled")}
        </label>
        <div className="mb-3 flex gap-4">
          <label className={labelClass}>
            {t("settings.workingHours.start")}
            <input
              className={inputClass}
              type="time"
              value={config.workingHours.startTime}
              onChange={(e) => updateWorkingHours({ startTime: e.target.value })}
            />
          </label>
          <label className={labelClass}>
            {t("settings.workingHours.end")}
            <input
              className={inputClass}
              type="time"
              value={config.workingHours.endTime}
              onChange={(e) => updateWorkingHours({ endTime: e.target.value })}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {DAY_KEYS.map((dayKey, index) => (
            <button
              key={dayKey}
              type="button"
              aria-pressed={config.workingHours.days[index]}
              onClick={() => toggleWorkingDay(index)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                config.workingHours.days[index]
                  ? "bg-bronze text-surface-50"
                  : "border border-bronze/30 bg-surface-50 text-ink/60"
              }`}
            >
              {t(`settings.workingHours.days.${dayKey}`)}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
