import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { VisitDTO } from "@inspectai/shared";
import ReportView from "../components/ReportView";

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [visit, setVisit] = useState<VisitDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/v1";

  const fetchVisit = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/visits/${id}`);
      if (!response.ok) {
        throw new Error("Visit report details could not be retrieved");
      }
      const data = await response.json() as VisitDTO;
      setVisit(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load inspection report. Please verify backend state.");
    } finally {
      setIsLoading(false);
    }
  }, [id, apiBase]);

  useEffect(() => {
    fetchVisit();
    // Poll state if generating report
    let timer: number | null = null;
    if (visit?.status === "GENERATING") {
      timer = window.setInterval(() => {
        fetchVisit();
      }, 5000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visit?.status, fetchVisit]);

  if (isLoading) {
    return <div className="state-message">Retrieving AI inspection report details...</div>;
  }

  if (error || !visit) {
    return (
      <div className="state-message">
        {error || "Report visit details not found."}{" "}
        <Link to="/" className="link">Start New Visit</Link>
      </div>
    );
  }

  // Show generating / empty states
  if (visit.status === "GENERATING") {
    return (
      <div className="report-page">
        <div className="sheet" style={{ padding: "60px 20px", textAlign: "center" }}>
          <div className="state-message">
            <h2>Generating Report...</h2>
            <p>Our engineering AI models are currently analyzing the collected evidence to compile the final report. This may take up to 60 seconds.</p>
            <div style={{ marginTop: "20px" }}>
              <span className="status-pill">Status: GENERATING</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!visit.report) {
    return (
      <div className="report-page">
        <div className="sheet" style={{ padding: "60px 20px", textAlign: "center" }}>
          <div className="state-message">
            <h2>No Report Generated Yet</h2>
            <p>The site visit is still OPEN. You must add evidence and trigger report generation first.</p>
            <div style={{ marginTop: "20px" }}>
              <Link to={`/visits/${visit.id}`} className="btn">
                Go to Visit Details & Add Evidence
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      <ReportView visit={visit} />
    </div>
  );
};

export default ReportPage;
