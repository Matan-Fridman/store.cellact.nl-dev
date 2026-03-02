import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StorePage } from "./pages/StorePage";
import { ClaimPage } from "./pages/ClaimPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StorePage />} />
        <Route path="/claim" element={<ClaimPage />} />
      </Routes>
    </BrowserRouter>
  );
}
