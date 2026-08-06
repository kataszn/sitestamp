import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { VisitDTO } from "@sitestamp/shared";

export const CompletedVisitsPage: React.FC = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<VisitDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/v1";

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await fetch(`${apiBase}/visits`);
        if (response.ok || response.status === 304) {
          const allVisits: VisitDTO[] = await response.json();
          setVisits(allVisits.filter((v) => v.status === "COMPLETE" || v.report));
        } else {
          console.warn("Unexpected response status:", response.status);
        }
      } catch (err) {
        console.error("Failed to fetch completed visits", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, [apiBase]);

  if (loading) {
    return (
      <div className="report-page">
        <div className="state-message">Loading completed visits...</div>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="sheet">
        {/* Header */}
        <div className="titleblock">
          <div className="eyebrow">
            <span>Inspection Records</span>
            <span>{visits.length} complete</span>
          </div>
          <h1 className="site-name">Completed Visits</h1>
          <div className="meta-row">
            <button
              onClick={() => navigate("/")}
              className="btn-secondary"
              style={{ fontSize: "11px", padding: "6px 12px" }}
            >
              &larr; Back
            </button>
          </div>
        </div>

        {/* Visit list */}
        {visits.length === 0 ? (
          <div className="section">
            <p style={{ color: "var(--steel)", fontSize: "14px", fontStyle: "italic", margin: 0 }}>
              No completed visits yet.
            </p>
          </div>
        ) : (
          <div style={{ padding: "16px 28px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {visits.map((visit) => (
              <div
                key={visit.id}
                onClick={() => navigate(`/visits/${visit.id}/report`)}
                className="card"
                style={{
                  margin: 0,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                  transition: "box-shadow 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "6px 6px 0 rgba(27,36,48,0.1)";
                  e.currentTarget.style.transform = "translate(-1px, -1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "4px 4px 0 rgba(27,36,48,0.06)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "16px", marginBottom: "4px" }}>
                    {visit.siteName}
                  </div>
                  <div className="meta-row" style={{ gap: "12px", fontSize: "11.5px" }}>
                    {visit.assetCode && <span>Asset: <b>{visit.assetCode}</b></span>}
                    <span>Inspector: <b>{visit.inspectorName}</b></span>
                    {visit.notes && <span>· {visit.notes}</span>}
                    <span>· {new Date(visit.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="status-pill" style={{ flexShrink: 0 }}>Complete</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedVisitsPage;