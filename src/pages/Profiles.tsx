import { useTranslation } from "react-i18next";
import { useAppData } from "../context/AppDataContext";
import { buttonClass, inputClass, labelClass, sectionClass } from "../styles";

export default function Profiles() {
  const { t } = useTranslation();
  const {
    config,
    updateProfile,
    addProfile,
    deleteProfile,
    setActiveProfile,
  } = useAppData();

  if (!config) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-ink">
        {t("settings.profiles.title")}
      </h1>
      <section className={sectionClass}>
        {config.profiles.map((profile) => (
          <div
            className="mb-3 rounded border border-bronze/20 bg-surface-50 p-4"
            key={profile.id}
          >
            <label className={labelClass}>
              {t("settings.profiles.name")}
              <input
                className={inputClass}
                value={profile.name}
                onChange={(e) =>
                  updateProfile(profile.id, { name: e.target.value })
                }
              />
            </label>
            <label className={labelClass}>
              {t("settings.profiles.intervalMin")}
              <input
                className={inputClass}
                type="number"
                min={1}
                value={profile.intervalMin}
                onChange={(e) =>
                  updateProfile(profile.id, {
                    intervalMin: Number(e.target.value) || 1,
                  })
                }
              />
            </label>
            <label className={labelClass}>
              {t("settings.profiles.breakSec")}
              <input
                className={inputClass}
                type="number"
                min={5}
                value={profile.breakSec}
                onChange={(e) =>
                  updateProfile(profile.id, {
                    breakSec: Number(e.target.value) || 5,
                  })
                }
              />
            </label>
            <label className={labelClass}>
              {t("settings.profiles.message")}
              <input
                className={inputClass}
                placeholder={t("settings.profiles.messagePlaceholder") ?? ""}
                value={profile.customMessage ?? ""}
                onChange={(e) =>
                  updateProfile(profile.id, {
                    customMessage: e.target.value || null,
                  })
                }
              />
            </label>
            <div className="mt-2 flex items-center gap-2">
              {profile.id === config.activeProfileId ? (
                <span className="rounded-full bg-oxide/20 px-3 py-1 text-xs text-oxide">
                  {t("settings.profiles.active")}
                </span>
              ) : (
                <button
                  className={buttonClass}
                  onClick={() => setActiveProfile(profile.id)}
                >
                  {t("settings.profiles.setActive")}
                </button>
              )}
              <button
                className={buttonClass}
                disabled={config.profiles.length <= 1}
                onClick={() => deleteProfile(profile.id)}
              >
                {t("settings.profiles.delete")}
              </button>
            </div>
          </div>
        ))}
        <button className={buttonClass} onClick={addProfile}>
          {t("settings.profiles.add")}
        </button>
      </section>
    </main>
  );
}
