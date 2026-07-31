import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { VisitDTO } from "@inspection/shared";
import EvidenceUploadForm from "../components/EvidenceUploadForm";

export const VisitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<VisitDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/v1";
  const mediaBase = apiBase.replace(/\/v1\/?$/, "");

  const getMediaUrl = (path: string | null) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `${mediaBase}${path}`;
  };

  const fetchVisit = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/visits/${id}`);
      if (!response.ok) {
        throw new Error("Visit not found");
      }
      const data = await response.json();
      setVisit(data);

      // If already complete or generating, redirect or adjust UI
      if (data.status === "COMPLETE") {
        navigate(`/visits/${id}/report`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id, apiBase, navigate]);

  useEffect(() => {
    fetchVisit();
  }, [fetchVisit]);

  const handleUpload = async (formData: FormData) => {
    const response = await fetch(`${apiBase}/visits/${id}/evidence`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    // Refresh visit evidence list
    await fetchVisit();
  };

  const handleGenerateReport = async () => {
    if (!visit || visit.evidence.length === 0) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`${apiBase}/visits/${id}/report`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Success, redirect to report view
      navigate(`/visits/${id}/report`);
    } catch (err) {
      console.error(err);
      alert("Failed to trigger report generation. Check if the AI models are configured.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <div className="state-message">Loading visit details...</div>;
  }

  if (!visit) {
    return (
      <div className="state-message">
        Visit not found. <Link to="/" className="link">Go Back</Link>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="sheet" style={{ padding: "40px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
          <div>
            <Link to="/" className="link">← Back to New Visit</Link>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "28px", margin: "8px 0 4px" }}>
              {visit.siteName}
            </h1>
            <p style={{ margin: 0, fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "var(--steel)" }}>
              Inspector: <b>{visit.inspectorName}</b> · Visit #{visit.id}
            </p>
          </div>
          <div>
            <span className="status-pill">{visit.status}</span>
          </div>
        </div>

        {visit.notes && (
          <div className="card" style={{ background: "var(--blueprint-soft)", borderLeft: "3px solid var(--blueprint)" }}>
            <h4 style={{ margin: "0 0 6px", fontFamily: "Space Grotesk, sans-serif", fontSize: "14px" }}>Notes:</h4>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>{visit.notes}</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px", marginTop: "24px" }}>
          {/* Evidence upload form */}
          <EvidenceUploadForm onUpload={handleUpload} />

          {/* List of current evidence */}
          <div className="card">
            <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "16px", margin: "0 0 14px" }}>
              Evidence Collected ({visit.evidence.length})
            </h3>

            {visit.evidence.length === 0 ? (
              <p style={{ color: "var(--steel)", fontSize: "14px", fontStyle: "italic", margin: 0 }}>
                No evidence has been uploaded for this visit yet. Upload at least one photo to generate a report.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {visit.evidence.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "10px",
                      border: "1.5px solid var(--ink)",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={getMediaUrl(item.imageUrl)}
                      alt={item.caption || "Evidence"}
                      style={{ width: "60px", height: "60px", objectFit: "cover", border: "1px solid var(--line)" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "500" }}>
                        {item.caption || <span style={{ color: "var(--steel)", fontStyle: "italic" }}>No caption</span>}
                      </p>
                      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "10.5px", color: "var(--steel)" }}>
                        Source: {item.captionSource === "VOICE" ? "🎙️ Voice Transcription" : "📝 Text Input"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action controls */}
        <div style={{ marginTop: "30px", borderTop: "1.5px solid var(--ink)", paddingTop: "20px", textAlign: "right" }}>
          <button
            onClick={handleGenerateReport}
            className="btn"
            style={{ width: "100%", fontSize: "14px", padding: "12px" }}
            disabled={visit.evidence.length === 0 || isGenerating}
          >
            {isGenerating ? "Generating Report (this may take up to 60s)..." : "Generate AI Defect Report 🔍"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitDetailPage;
