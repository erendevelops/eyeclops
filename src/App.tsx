import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { api } from "./api";
import AppShell from "./components/AppShell";
import { AppDataProvider } from "./context/AppDataContext";
import Home from "./pages/Home";
import Profiles from "./pages/Profiles";
import WorkingHoursPage from "./pages/WorkingHoursPage";
import Settings from "./pages/Settings";
import Overlay from "./pages/Overlay";

export default function App() {
  const location = useLocation();
  const [homeBackground, setHomeBackground] = useState<string | null>(null);

  useEffect(() => {
    api.getBackgroundImage("home").then(setHomeBackground);
  }, []);

  // The break overlay is a separate frameless window with no nav/chrome —
  // render it standalone, outside the shell and the shared app-data context.
  if (location.pathname === "/overlay") {
    return <Overlay />;
  }

  // The optional background image only applies to the Home screen; other
  // pages (Profiles, Working Hours, Settings) stay plain dark.
  const backgroundUrl = location.pathname === "/" ? homeBackground : null;

  return (
    <AppDataProvider>
      <AppShell backgroundUrl={backgroundUrl}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/working-hours" element={<WorkingHoursPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
    </AppDataProvider>
  );
}
