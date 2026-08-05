import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { VisitDTO } from "@sitestamp/shared";
import ReportView from "../components/ReportView";

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [visit, setVisit] = useState<VisitDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/v1";
  const generateRequested = searchParams.get("generate") === "1";

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
  }, [fetchVisit]);

  useEffect(() => {
    if (visit?.status === "COMPLETE" && generateRequested) {
      navigate(`/visits/${id}/report`, { replace: true });
    }
  }, [visit?.status, generateRequested, navigate, id]);

  useEffect(() => {
    const shouldPoll = generateRequested || visit?.status === "GENERATING";
    if (!shouldPoll || visit?.status === "COMPLETE" || visit?.status === "FAILED") {
      return;
    }

    const timer = window.setInterval(() => {
      void fetchVisit();
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [generateRequested, visit?.status, fetchVisit]);

  const showGeneratingView =
    (generateRequested || visit?.status === "GENERATING") && visit?.status !== "FAILED";

  const handleRetry = async () => {
    try {
      await fetch(`${apiBase}/visits/${id}/report`, { method: "POST" });
    } catch (err) {
      console.error("Failed to retry report generation", err);
    }
    // Redirect to the visit details page (same flow as regenerate) so the
    // page mounts fresh and reflects the current status reliably.
    navigate(`/visits/${id}`);
  };

  const [noteStep, setNoteStep] = useState(0);
  const steps = ["Loading evidence", "Analyzing images", "Writing report"];

  useEffect(() => {
    if (!showGeneratingView) {
      setNoteStep(0);
      return;
    }

    const timer = window.setInterval(() => {
      setNoteStep((prev) => (prev < steps.length ? prev + 1 : prev));
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, [showGeneratingView]);

  const renderGeneratingView = () => (
    <div className="report-page">
      <div className="sheet" style={{ padding: "44px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "16px", marginBottom: "20px" }}>
          <div>
            <Link to={visit ? `/visits/${visit.id}` : "/"} className="link">
              ← Back to Visit
            </Link>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "28px", margin: "8px 0 4px" }}>
              {visit?.siteName || "Generating report"}
            </h1>
            <p style={{ margin: 0, fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "var(--steel)" }}>
              {visit ? <>Inspector: <b>{visit.inspectorName}</b> · Visit #{visit.id}</> : "Starting report generation..."}
            </p>
          </div>
          <div>
            <span className="status-pill">GENERATING</span>
          </div>
        </div>

        <div className="generation-panel">
          <div className="generation-loader" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
              Generating report
            </div>
          </div>

          <div className="generation-note">
            {noteStep < steps.length ? (
              <span className="note-active">{steps[noteStep]}</span>
            ) : (
              <span className="note-active">Please wait</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFailedView = () => (
    <div className="report-page">
      <div className="sheet" style={{ padding: "44px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "16px", marginBottom: "20px" }}>
          <div>
            <Link to={visit ? `/visits/${visit.id}` : "/"} className="link">
              ← Back to Visit
            </Link>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "28px", margin: "8px 0 4px" }}>
              {visit?.siteName || "Report generation failed"}
            </h1>
            <p style={{ margin: 0, fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "var(--steel)" }}>
              {visit ? <>Inspector: <b>{visit.inspectorName}</b> · Visit #{visit.id}</> : "Report generation failed"}
            </p>
          </div>
          <div>
            <span className="status-pill">FAILED</span>
          </div>
        </div>

        <div className="review-banner" style={{ marginBottom: "20px" }}>
          Report generation failed: {visit?.lastError ?? "unknown error"}.
        </div>

        <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
          <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "12.5px", color: "var(--steel)", margin: "0 0 20px" }}>
            The AI model could not complete the report. You can try again, or go back to review your evidence.
          </p>
          <button className="btn" onClick={handleRetry}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    if (visit?.status === "FAILED") {
      return renderFailedView();
    }
    if (showGeneratingView) {
      return renderGeneratingView();
    }
    return <div className="state-message">Retrieving AI inspection report details...</div>;
  }

  if (error || !visit) {
    if (visit?.status === "FAILED") {
      return renderFailedView();
    }
    if (showGeneratingView) {
      return renderGeneratingView();
    }
    return (
      <div className="state-message">
        {error || "Report visit details not found."}{" "}
        <Link to="/" className="link">Start New Visit</Link>
      </div>
    );
  }

  if (visit.status === "FAILED") {
    return renderFailedView();
  }

  if (showGeneratingView) {
    return renderGeneratingView();
  }

  return (
    <div className="report-page">
      <ReportView visit={visit} />
    </div>
  );
};

export default ReportPage;
