import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NewVisitPage from "./pages/NewVisitPage";
import VisitDetailPage from "./pages/VisitDetailPage";
import ReportPage from "./pages/ReportPage";
import VisitsPage from "./pages/VisitsPage";
import { ToastProvider } from "./components/Toast";
import "./styles/report.css";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NewVisitPage />} />
          <Route path="/visits" element={<VisitsPage />} />
          <Route path="/visits/:id" element={<VisitDetailPage />} />
          <Route path="/visits/:id/report" element={<ReportPage />} />
          <Route path="/share/:visitId" element={<ReportPage readOnly />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
