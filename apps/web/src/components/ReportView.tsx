import React from "react";
import { VisitDTO } from "@inspection/shared";
import SeverityGauge from "./SeverityGauge";
import DefectItem from "./DefectItem";

interface ReportViewProps {
  visit: VisitDTO;
}

export const ReportView: React.FC<ReportViewProps> = ({ visit }) => {
  const { report, evidence, id, siteName, createdAt } = visit;

  if (!report) {
    return <div className="state-message">No report generated for this visit yet.</div>;
  }

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
          <span>Inspection AI · Field Inspection Report</span>
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
        <h2 className="section-title">Executive Summary</h2>
        <p className="summary-text">{report.summary}</p>
      </div>

      {/* 5. Defects section */}
      {report.defects && report.defects.length > 0 && (
        <div className="section">
          <h2 className="section-title">
            Observed Defects <span className="count">({report.defects.length})</span>
          </h2>
          <div>
            {report.defects.map((defect, index) => (
              <DefectItem key={index} defect={defect} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* 6. Recommendation inside rec-box */}
      <div className="section">
        <h2 className="section-title">Engineering Recommendations</h2>
        <div className="rec-box">
          <p className="rec-text">{report.recommendation}</p>
        </div>
      </div>

      {/* 7. Evidence section */}
      {evidence && evidence.length > 0 && (
        <div className="section">
          <h2 className="section-title">Collected Evidence</h2>
          <div className="evidence-list">
            {evidence.map((item) => (
              <div key={item.id} className="evidence-chip">
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
          Generated automatically by Inspection AI. All assessments should be verified by a licensed PE.
        </div>
        <button className="export-btn" onClick={() => window.print()}>
          Export / Print Report
        </button>
      </div>
    </div>
  );
};

export default ReportView;
