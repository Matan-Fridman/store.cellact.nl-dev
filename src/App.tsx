import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { StorePage } from "./pages/StorePage";
import { ClaimPage } from "./pages/ClaimPage";
import { SuccessPage } from "./pages/SuccessPage";
import { PortPage } from "./pages/PortPage";

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StorePage />} />
          <Route path="/claim" element={<ClaimPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/port" element={<PortPage />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
