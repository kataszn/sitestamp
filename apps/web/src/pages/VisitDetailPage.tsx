import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { VisitDTO } from "@inspectai/shared";
import EvidenceUploadForm from "../components/EvidenceUploadForm";
import { useToast } from "../components/Toast";

export const VisitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [visit, setVisit] = useState<VisitDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
    navigate(`/visits/${id}/report?generate=1`);

    void fetch(`${apiBase}/visits/${id}/report`, {
      method: "POST",
    }).catch((err) => {
      console.error(err);
      showToast("Failed to trigger report generation. Check if the AI models are configured.", "error");
    });
  };

  const handleRemoveEvidence = async (evidenceId: string) => {
    try {
      const response = await fetch(`${apiBase}/visits/evidence/${evidenceId}/remove`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to remove evidence");
      }
      await fetchVisit();
    } catch (err) {
      console.error(err);
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
                {visit.evidence.map((item, idx) => (
                  <div key={item.id}>
                    <div
                      onClick={() => setLightboxIndex(idx)}
                      style={{
                        display: "flex",
                        gap: "12px",
                        padding: "10px",
                        border: "1.5px solid var(--ink)",
                        alignItems: "center",
                        cursor: "pointer",
                        transition: "box-shadow 0.15s",
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
                        {item.caption && (
                          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "10.5px", color: "var(--steel)" }}>
                            Source: {item.captionSource === "VOICE" ? "🎙️ Voice" : "📝 Text"}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveEvidence(item.id);
                        }}
                        title="Remove evidence"
                        style={{
                          background: "none",
                          border: "1.5px solid var(--critical)",
                          color: "var(--critical)",
                          cursor: "pointer",
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: "16px",
                          fontWeight: "500",
                          flexShrink: 0,
                          lineHeight: 1,
                          transition: "background 0.15s, color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "var(--critical)";
                          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "none";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--critical)";
                        }}
                      >
                        ×
                      </button>
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
            {isGenerating ? "Generating Report (may take up to 60s)..." : "Generate Inspection Report 🔍"}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && visit && (() => {
        const item = visit.evidence[lightboxIndex];
        if (!item) return null;
        return (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(
                lightboxIndex === 0 ? visit.evidence.length - 1 : lightboxIndex - 1
              );
            }}
            style={{
              position: "absolute",
              left: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              fontSize: "32px",
              width: "52px",
              height: "52px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderRadius: "50%",
              transition: "background 0.15s",
              zIndex: 1001,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >
            ←
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
          >
            <img
              src={getMediaUrl(item.imageUrl)}
              alt={item.caption || "Evidence"}
              style={{
                maxWidth: "100%",
                maxHeight: item.caption ? "75vh" : "85vh",
                objectFit: "contain",
                borderRadius: "4px",
              }}
            />
            {item.caption && (
              <p
                style={{
                  margin: 0,
                  color: "#fff",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  textAlign: "center",
                  maxWidth: "600px",
                }}
              >
                {item.caption}
              </p>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(
                lightboxIndex === visit.evidence.length - 1 ? 0 : lightboxIndex + 1
              );
            }}
            style={{
              position: "absolute",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              fontSize: "32px",
              width: "52px",
              height: "52px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderRadius: "50%",
              transition: "background 0.15s",
              zIndex: 1001,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >
            →
          </button>

          <button
            onClick={() => setLightboxIndex(null)}
            style={{
              position: "absolute",
              top: "16px",
              right: "20px",
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "28px",
              cursor: "pointer",
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
              fontFamily: "IBM Plex Mono, monospace",
            }}
          >
            ×
          </button>

          {/* Counter */}
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.6)",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: "13px",
              letterSpacing: "0.04em",
            }}
          >
            {lightboxIndex + 1} / {visit.evidence.length}
          </div>
        </div>
      )})()}
    </div>
  );
};

export default VisitDetailPage;
