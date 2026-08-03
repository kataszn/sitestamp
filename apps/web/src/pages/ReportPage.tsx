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
    if (!shouldPoll || visit?.status === "COMPLETE") {
      return;
    }

    const timer = window.setInterval(() => {
      void fetchVisit();
    }, 2500);

    return () => {
      clearInterval(timer);
    };
  }, [generateRequested, visit?.status, fetchVisit]);

  const showGeneratingView = generateRequested || visit?.status === "GENERATING";

  const [captionStep, setCaptionStep] = useState(0);
  const steps = ["Loading evidence", "Analyzing images", "Writing report"];

  useEffect(() => {
    if (!showGeneratingView) {
      setCaptionStep(0);
      return;
    }

    const timer = window.setInterval(() => {
      setCaptionStep((prev) => (prev < steps.length ? prev + 1 : prev));
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

          <div className="generation-caption">
            {captionStep < steps.length ? (
              <span className="caption-active">{steps[captionStep]}</span>
            ) : (
              <span className="caption-active">Please wait</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    if (showGeneratingView) {
      return renderGeneratingView();
    }
    return <div className="state-message">Retrieving AI inspection report details...</div>;
  }

  if (error || !visit) {
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

  if (showGeneratingView) {
    return renderGeneratingView();
  }

  if (!visit.report || visit.status !== "COMPLETE") {
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
