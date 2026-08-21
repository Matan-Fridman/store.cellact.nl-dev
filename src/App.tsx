import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { StorePage } from "./pages/StorePage";
import { SixSevenPage } from "./pages/SixSevenPage";
import { ClaimPage } from "./pages/ClaimPage";
import { SuccessPage } from "./pages/SuccessPage";
import { ActivatePage } from "./pages/ActivatePage";
import { PortPage } from "./pages/PortPage";
import { PortCompletePage } from "./pages/PortCompletePage";
import { RecoverPage } from "./pages/RecoverPage";
import { ManagePage } from "./pages/ManagePage";
import { CryptoWaitPage } from "./pages/CryptoWaitPage";
import { CryptoRecoverPage } from "./pages/CryptoRecoverPage";
import { CryptoPage } from "./pages/CryptoPage";
import { initAnalytics, trackPageView } from "./lib/analytics";

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}

export default function App() {
  // Vite BASE_URL is "/" with a custom domain, or "/repo/" on project Pages
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

  return (
    <LanguageProvider>
      <BrowserRouter basename={basename}>
        <AnalyticsTracker />
        <Routes>
          <Route path="/" element={<StorePage />} />
          <Route path="/67" element={<SixSevenPage />} />
          <Route path="/claim" element={<ClaimPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/activate" element={<ActivatePage />} />
          <Route path="/port" element={<PortPage />} />
          <Route path="/port/complete" element={<PortCompletePage />} />
          <Route path="/recover" element={<RecoverPage />} />
          <Route path="/manage" element={<ManagePage />} />
          <Route path="/crypto" element={<CryptoPage />} />
          <Route path="/crypto/why" element={<CryptoPage />} />
          <Route path="/crypto/wait" element={<CryptoWaitPage />} />
          <Route path="/crypto/recover" element={<CryptoRecoverPage />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
