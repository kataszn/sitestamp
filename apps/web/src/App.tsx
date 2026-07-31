import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NewVisitPage from "./pages/NewVisitPage";
import VisitDetailPage from "./pages/VisitDetailPage";
import ReportPage from "./pages/ReportPage";
import "./styles/report.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NewVisitPage />} />
        <Route path="/visits/:id" element={<VisitDetailPage />} />
        <Route path="/visits/:id/report" element={<ReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
