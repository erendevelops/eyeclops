import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import type { BreakInfo } from "../types";

export default function Overlay() {
  const { t } = useTranslation();
  const [breakInfo, setBreakInfo] = useState<BreakInfo | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getActiveBreakInfo().then((info) => {
      if (cancelled || !info) return;
      setBreakInfo(info);
      setSecondsLeft(info.breakSec);
    });
    api.getBackgroundImage("overlay").then((url) => {
      if (!cancelled) setBackgroundUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      void api.skipBreak();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const message = breakInfo?.customMessage || t(breakInfo?.messageKey ?? "break.default");

  return (
    <main className="overlay">
      {backgroundUrl && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
            aria-hidden="true"
          />
          {/* Dark scrim so the message/countdown/button stay readable over
           * whatever image the user picked. */}
          <div className="absolute inset-0 bg-surface-50/60" aria-hidden="true" />
        </>
      )}
      <div className="relative flex flex-col items-center gap-6">
        <h1>{t("break.titleActive")}</h1>
        <p className="overlay-message">{message}</p>
        {secondsLeft !== null && <p className="overlay-countdown">{secondsLeft}</p>}
        <div className="overlay-actions">
          <button onClick={() => api.skipBreak()}>{t("break.skip")}</button>
        </div>
      </div>
    </main>
  );
}
