import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StorePage } from "./pages/StorePage";
import { ClaimPage } from "./pages/ClaimPage";
import { SuccessPage } from "./pages/SuccessPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StorePage />} />
        <Route path="/claim" element={<ClaimPage />} />
        <Route path="/success" element={<SuccessPage />} />
      </Routes>
    </BrowserRouter>
  );
}
