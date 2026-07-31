import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { VisitDTO } from "@inspectai/shared";
import ReportView from "../components/ReportView";

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [visit, setVisit] = useState<VisitDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressPreview, setProgressPreview] = useState("");
  const [streamStatus, setStreamStatus] = useState<"idle" | "connecting" | "streaming" | "done" | "error">("idle");
  const [streamError, setStreamError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const progressBufferRef = useRef("");

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
    if (visit?.report && generateRequested) {
      navigate(`/visits/${id}/report`, { replace: true });
    }
  }, [visit?.report, generateRequested, navigate, id]);

  useEffect(() => {
    const shouldStream = generateRequested || visit?.status === "GENERATING";
    if (!shouldStream || visit?.report) {
      return;
    }

    const streamUrl = new URL(`${apiBase}/visits/${id}/report/stream`);
    if (generateRequested) {
      streamUrl.searchParams.set("start", "1");
    }

    const source = new EventSource(streamUrl.toString());
    eventSourceRef.current = source;
    progressBufferRef.current = "";
    setStreamStatus("connecting");
    setStreamError(null);
    setProgressPreview("");

    const handleMessage = (event: MessageEvent) => {
      if (event.data === "[DONE]") {
        setStreamStatus("done");
        source.close();
        eventSourceRef.current = null;
        void fetchVisit();
        return;
      }

      let data: { text?: string; preview?: string; error?: string } | null = null;
      try {
        data = JSON.parse(event.data) as { text?: string; preview?: string; error?: string };
      } catch {
        data = null;
      }

      if (!data) {
        return;
      }

      if (data.error) {
        setStreamStatus("error");
        setStreamError(data.error);
        source.close();
        eventSourceRef.current = null;
        return;
      }

      if (typeof data.preview === "string") {
        progressBufferRef.current = data.preview;
        setProgressPreview(
          data.preview.length > 200 ? `...${data.preview.slice(-200)}` : data.preview
        );
      }

      if (typeof data.text === "string") {
        progressBufferRef.current += data.text;
        const combined = progressBufferRef.current;
        setProgressPreview(combined.length > 200 ? `...${combined.slice(-200)}` : combined);
        setStreamStatus("streaming");
      }
    };

    source.addEventListener("message", handleMessage);
    source.onerror = () => {
      setStreamStatus("error");
      setStreamError("Connection to the generation stream was lost.");
      source.close();
      eventSourceRef.current = null;
    };

    return () => {
      source.close();
      eventSourceRef.current = null;
    };
  }, [apiBase, id, generateRequested, visit?.status, visit?.report, fetchVisit]);

  const showGeneratingView = generateRequested || visit?.status === "GENERATING";

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

        <div style={{ background: "var(--blueprint-soft)", border: "1.5px solid var(--ink)", boxShadow: "4px 4px 0 rgba(27,36,48,0.06)", padding: "20px" }}>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--blueprint)", marginBottom: "10px" }}>
            {streamStatus === "error" ? "Stream interrupted" : "Model is thinking and writing..."}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--blueprint)", opacity: 0.75 }} />
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "20px", fontWeight: 600 }}>
              Generating report
            </div>
          </div>

          <p style={{ margin: "0 0 16px", color: "var(--steel)", fontSize: "14px", lineHeight: 1.6 }}>
            The inspection assistant is analyzing the evidence and compiling the final report. This view updates live while the model streams its response.
          </p>

          <div style={{ border: "1.5px solid var(--ink)", background: "var(--sheet)", minHeight: "140px", padding: "16px", fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", lineHeight: 1.7, whiteSpace: "pre-wrap", overflow: "auto" }}>
            {streamError ? (
              <span style={{ color: "var(--critical)" }}>{streamError}</span>
            ) : progressPreview || "Waiting for the model to begin streaming..."}
          </div>

          <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "11px", color: "var(--steel)" }}>
              {streamStatus === "streaming" ? "Live preview updating" : streamStatus === "connecting" ? "Connecting to generation stream..." : streamStatus === "done" ? "Generation complete" : "Preparing report stream..."}
            </span>
            <span className="status-pill">Status: GENERATING</span>
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

  if (showGeneratingView && !visit.report) {
    return renderGeneratingView();
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
