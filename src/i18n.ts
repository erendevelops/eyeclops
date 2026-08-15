import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import tr from "./locales/tr.json";

export const SUPPORTED_LANGUAGES = ["en", "tr"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function detectDefaultLanguage(): SupportedLanguage {
  const osLocale = navigator.language?.toLowerCase() ?? "en";
  return osLocale.startsWith("tr") ? "tr" : "en";
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
    },
    lng: detectDefaultLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18n;
