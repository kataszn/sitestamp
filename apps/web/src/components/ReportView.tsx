import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { VisitDTO } from "@sitestamp/shared";
import SeverityGauge from "./SeverityGauge";
import DefectItem from "./DefectItem";

export function ReportView({ visit }: { visit: VisitDTO }) {
  const navigate = useNavigate();
  const { report, evidence, id, siteName, createdAt } = visit;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);

  if (!report) {
    return (
      <div className="report-page">
        <div className="sheet" style={{ padding: "60px 20px", textAlign: "center" }}>
          <div className="state-message">
            <h2>No Report Generated Yet</h2>
            <p>This site visit is still open. Add evidence and generate a report to see it here.</p>
            <div style={{ marginTop: "20px" }}>
              <Link to={`/visits/${visit.id}`} className="btn">Go to Visit Details &amp; Add Evidence</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedEvidenceIds = new Set(
    selectedIndex !== null ? report.defects[selectedIndex]?.evidenceIds ?? [] : []
  );

  const isStale = visit.status === 'OPEN';

  // Scroll the first highlighted evidence chip into view when a defect is selected
  useEffect(() => {
    if (selectedIndex === null || !evidenceRef.current) return;

    evidenceRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [selectedIndex]);

  // Get the media base URL by stripping '/v1' from the API base URL
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/v1";
  const mediaBase = apiBase.replace(/\/v1\/?$/, "");

  const getMediaUrl = (path: string | null) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `${mediaBase}${path}`;
  };

  const handleRegenerate = async () => {
    try {
      await fetch(`${apiBase}/visits/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OPEN" }),
      });
    } catch (err) {
      console.error("Failed to reset visit status", err);
    }
    navigate(`/visits/${id}`);
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  // Multimodal input summary for the title-block meta row
  const photoCount = evidence.length;
  const voiceNoteCount = evidence.filter((e) => e.noteSource === "VOICE").length;
  const textNoteCount = evidence.filter((e) => e.noteSource === "TEXT").length;
  const hasInspectorNotes = visit.notes != null || textNoteCount > 0;

  const parts = [`${photoCount} Photo${photoCount === 1 ? "" : "s"}`];
  if (voiceNoteCount > 0) {
    parts.push(`${voiceNoteCount} Voice Note${voiceNoteCount === 1 ? "" : "s"}`);
  }
  if (hasInspectorNotes) {
    parts.push("Inspector Notes");
  }
  const inputsSummary = parts.join(" • ");

  return (
    <div className="sheet">
      {/* Stale banner when report exists but visit is OPEN (regenerate was clicked) */}
      {isStale && (
        <div className="stale-banner">
          This report was generated before recent changes to this visit's evidence.{' '}
          <Link to={`/visits/${id}`} className="inline-link">Add more evidence or regenerate</Link>.
        </div>
      )}

      {/* 1. Optional review banner at the very top */}
      {report.needsReview && (
        <div className="review-banner">
          Flagged for manual review — one or more defects could not be assessed with confidence
        </div>
      )}

      {/* 2. Title block */}
      <div className="titleblock">
        <div className="eyebrow">
          <span>SiteStamp · Field Inspection Report</span>
          <span>Visit #{id}</span>
        </div>
        <h1 className="site-name">{siteName}</h1>
        <div className="meta-row">
          <span>
            DATE: <b>{formattedDate}</b>
          </span>
          <span>
            INSPECTOR: <b>{visit.inspectorName || "Unknown"}</b>
          </span>
          <span>
            STATUS: <span className="status-pill">{visit.status}</span>
          </span>
          <span>
            EVIDENCE: <b>{inputsSummary}</b>
          </span>
        </div>
      </div>

      {/* 3. Severity gauge */}
      <SeverityGauge severity={report.severity} />

      {/* 4. Summary section */}
      <div className="section">
        <h2 className="section-title">Summary</h2>
        <p className="summary-text">{report.summary}</p>
      </div>

      {/* 5. Defects section */}
      {report.defects && report.defects.length > 0 && (
        <div className="section">
          <h2 className="section-title">
            Defects <span className="count">{report.defects.length} found</span>
          </h2>
          <div>
            {report.defects.map((defect, index) => (
              <DefectItem
                key={index}
                defect={defect}
                index={index}
                selected={selectedIndex === index}
                onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 6. Recommendation inside rec-box */}
      <div className="section">
        <h2 className="section-title">Recommendation</h2>
        <div className="rec-box">
          <p className="rec-text">{report.recommendation}</p>
        </div>
      </div>

      {/* 7. Evidence section */}
      {evidence && evidence.length > 0 && (
        <div className="section">
          <h2 className="section-title">
            Evidence <span className="count">({evidence.length})</span>
          </h2>
          <div className="evidence-list" ref={evidenceRef}>
            {evidence.map((item, idx) => (
              <div
                key={item.id}
                className={`evidence-chip${selectedEvidenceIds.has(item.id) ? ' highlighted' : ''}`}
                onClick={() => setLightboxIndex(idx)}
                style={{ cursor: "pointer" }}
              >
                <img
                  className="thumb"
                  src={getMediaUrl(item.imageUrl)}
                  alt={item.note || "Inspection Evidence"}
                />
                <span>{item.note || "No note provided"}</span>
                {item.noteSource === "VOICE" && (
                  <span className="source-tag" title="Voice Note Transcription">
                    🎙️
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Footer */}
      <div className="footer">
        <div className="footer-note">
          Generated by Gemma 4. All assessments should be verified by a licensed PE.
        </div>
        <div className="footer-actions">
          <button className="regenerate-btn" onClick={handleRegenerate}>
            + Regenerate
          </button>
          <button className="export-btn" onClick={() => window.print()}>
            Export
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && evidence && (() => {
        const item = evidence[lightboxIndex];
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
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex === 0 ? evidence.length - 1 : lightboxIndex - 1); }}
            style={{
              position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
              fontSize: "32px", width: "52px", height: "52px", display: "flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
              borderRadius: "50%", transition: "background 0.15s", zIndex: 1001,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >←</button>

          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img
              src={getMediaUrl(item.imageUrl)}
              alt={item.note || "Evidence"}
              style={{ maxWidth: "100%", maxHeight: item.note ? "75vh" : "85vh", objectFit: "contain", borderRadius: "4px" }}
            />
            {item.note && <p style={{ margin: 0, color: "#fff", fontSize: "15px", lineHeight: "1.5", textAlign: "center", maxWidth: "600px" }}>{item.note}</p>}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex === evidence.length - 1 ? 0 : lightboxIndex + 1); }}
            style={{
              position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
              fontSize: "32px", width: "52px", height: "52px", display: "flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
              borderRadius: "50%", transition: "background 0.15s", zIndex: 1001,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >→</button>

          <button
            onClick={() => setLightboxIndex(null)}
            style={{
              position: "absolute", top: "16px", right: "20px",
              background: "none", border: "none", color: "#fff", fontSize: "28px",
              cursor: "pointer", width: "44px", height: "44px", display: "flex",
              alignItems: "center", justifyContent: "center", zIndex: 1001,
              fontFamily: "IBM Plex Mono, monospace",
            }}
          >×</button>

          <div style={{
            position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.6)", fontFamily: "IBM Plex Mono, monospace",
            fontSize: "13px", letterSpacing: "0.04em",
          }}>
            {lightboxIndex + 1} / {evidence.length}
          </div>
        </div>
      )})()}
    </div>
  );
};

export default ReportView;
