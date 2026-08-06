import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { VisitDTO } from "@sitestamp/shared";
import ReportView from "../components/ReportView";

export const ReportPage: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const { id, visitId } = useParams<{ id: string; visitId: string }>();
  const visitIdParam = id ?? visitId;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [visit, setVisit] = useState<VisitDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/v1";
  const generateRequested = searchParams.get("generate") === "1";

  const fetchVisit = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/visits/${visitIdParam}`);
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
  }, [visitIdParam, apiBase]);

  useEffect(() => {
    fetchVisit();
  }, [fetchVisit]);

  useEffect(() => {
    if (visit?.status === "COMPLETE" && generateRequested) {
      navigate(`/visits/${visitIdParam}/report`, { replace: true });
    }
  }, [visit?.status, generateRequested, navigate, visitIdParam]);

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
    if (retrying) return;
    setRetrying(true);
    try {
      // Reset the visit to OPEN so the report is marked stale; the user can
      // then regenerate from the visit details page.
      await fetch(`${apiBase}/visits/${visitIdParam}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OPEN" }),
      });
    } catch (err) {
      console.error("Failed to reset visit status", err);
      setRetrying(false);
      return;
    }
    // Navigate to the visit details page with the visit back in OPEN status.
    navigate(`/visits/${visitIdParam}`);
  };

  const [noteStep, setNoteStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const generatingSteps = useMemo(() => {
    const photoCount = visit?.evidence.length ?? 0;
    const hasVoiceNote = visit?.evidence.some((e) => e.noteSource === 'VOICE') ?? false;
    const hasEvidenceNotes = visit?.evidence.some((e) => e.note && e.noteSource === 'TEXT') ?? false;
    const hasNotes = Boolean(visit?.notes);
    return [
      "Processing",

      `Reading ${photoCount} photo${photoCount === 1 ? '' : 's'}`,

      ...(hasVoiceNote
        ? ["Transcribing voice observations"]
        : []),

      ...(hasEvidenceNotes
        ? ["Reviewing evidence observations"]
        : []),

      ...(hasNotes
        ? ["Incorporating inspector notes"]
        : []),

      "Correlating observations across evidence",

      "Identifying structural defects",

      "Assessing defect severity",

      "Drafting engineering recommendations",

      "Building inspection report",
    ];
  }, [visit]);

  useEffect(() => {
    if (!showGeneratingView) {
      setNoteStep(0);
      setElapsed(0);
      return;
    }

    const stepTimer = window.setInterval(() => {
      setNoteStep((i) => Math.min(i + 1, generatingSteps.length - 1));
    }, 4000);
    const clock = window.setInterval(() => setElapsed((s) => s + 1), 1000);

    return () => {
      clearInterval(stepTimer);
      clearInterval(clock);
    };
  }, [showGeneratingView, generatingSteps.length]);

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
              {visit ? <>{visit.assetCode && <span>Asset: <b>{visit.assetCode}</b> · </span>}Inspector: <b>{visit.inspectorName}</b> · Visit #{visit.id}</> : "Starting report generation..."}
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
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "11px", color: "var(--steel)" }}>
              {elapsed}s elapsed — typically takes 30–60s
            </div>
          </div>

          <div className="generation-note">
            <span className="note-active">{generatingSteps[noteStep]}…</span>
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
              {visit ? <>{visit.assetCode && <span>Asset: <b>{visit.assetCode}</b> · </span>}Inspector: <b>{visit.inspectorName}</b> · Visit #{visit.id}</> : "Report generation failed"}
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
          <button className="btn" onClick={handleRetry} disabled={retrying}>
            {retrying ? "Resetting visit…" : "Try again"}
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
      <ReportView visit={visit} readOnly={readOnly} />
    </div>
  );
};

export default ReportPage;
