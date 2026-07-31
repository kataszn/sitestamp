import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { VisitDTO } from "@inspectai/shared";
import SeverityGauge from "./SeverityGauge";
import DefectItem from "./DefectItem";

interface ReportViewProps {
  visit: VisitDTO;
}

export const ReportView: React.FC<ReportViewProps> = ({ visit }) => {
  const navigate = useNavigate();
  const { report, evidence, id, siteName, createdAt } = visit;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);

  if (!report) {
    return <div className="state-message">No report generated for this visit yet.</div>;
  }

  const selectedEvidenceIds = new Set(
    selectedIndex !== null ? report.defects[selectedIndex]?.evidenceIds ?? [] : []
  );

  // Scroll the first highlighted evidence chip into view when a defect is selected
  useEffect(() => {
    if (selectedIndex === null || !evidenceRef.current) return;
    const firstHighlighted = evidenceRef.current.querySelector<HTMLElement>(".evidence-chip.highlighted");
    if (firstHighlighted) {
      firstHighlighted.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
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

  return (
    <div className="sheet">
      {/* 1. Optional review banner at the very top */}
      {report.needsReview && (
        <div className="review-banner">
          Attention: This report requires engineering review. Some observations are ambiguous.
        </div>
      )}

      {/* 2. Title block */}
      <div className="titleblock">
        <div className="eyebrow">
          <span>InspectAI · Field Inspection Report</span>
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
            {evidence.map((item) => (
              <div key={item.id} className={`evidence-chip${selectedEvidenceIds.has(item.id) ? ' highlighted' : ''}`}>
                <img
                  className="thumb"
                  src={getMediaUrl(item.imageUrl)}
                  alt={item.caption || "Inspection Evidence"}
                />
                <span>{item.caption || "No caption provided"}</span>
                {item.captionSource === "VOICE" && (
                  <span className="source-tag" title="Voice Caption Transcription">
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
    </div>
  );
};

export default ReportView;
