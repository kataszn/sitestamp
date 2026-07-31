import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NewVisitPage from "./pages/NewVisitPage";
import VisitDetailPage from "./pages/VisitDetailPage";
import ReportPage from "./pages/ReportPage";
import CompletedVisitsPage from "./pages/CompletedVisitsPage";
import { ToastProvider } from "./components/Toast";
import "./styles/report.css";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NewVisitPage />} />
          <Route path="/visits/completed" element={<CompletedVisitsPage />} />
          <Route path="/visits/:id" element={<VisitDetailPage />} />
          <Route path="/visits/:id/report" element={<ReportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
