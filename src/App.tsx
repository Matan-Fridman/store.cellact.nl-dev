import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { StorePage } from "./pages/StorePage";
import { ClaimPage } from "./pages/ClaimPage";
import { SuccessPage } from "./pages/SuccessPage";
import { ActivatePage } from "./pages/ActivatePage";
import { PortPage } from "./pages/PortPage";
import { PortCompletePage } from "./pages/PortCompletePage";

const ANALYTICS_URL =
  "https://europe-west1-arnacon-production-gcp.cloudfunctions.net/website-analytics";

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      try {
        await fetch(ANALYTICS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: location.pathname,
            referrer: document.referrer || "direct",
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            source: "secnumnl",
          }),
        });
      } catch {
        // Silent — analytics must never break the store UX
      }
    };

    void trackVisit();
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AnalyticsTracker />
        <Routes>
          <Route path="/" element={<StorePage />} />
          <Route path="/claim" element={<ClaimPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/activate" element={<ActivatePage />} />
          <Route path="/port" element={<PortPage />} />
          <Route path="/port/complete" element={<PortCompletePage />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
