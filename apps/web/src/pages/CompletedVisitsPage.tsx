import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { VisitDTO } from "@inspection/shared";

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

  return (
    <div className="report-page">
      <div className="sheet" style={{ padding: "40px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--steel)",
            }}
          >
            &larr; Back
          </button>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "28px", margin: 0 }}>
            Completed Visits
          </h1>
        </div>

        {loading ? (
          <p style={{ color: "var(--steel)", fontSize: "14px" }}>Loading...</p>
        ) : visits.length === 0 ? (
          <p style={{ color: "var(--steel)", fontSize: "14px" }}>No completed visits yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {visits.map((visit) => (
              <div
                key={visit.id}
                onClick={() => navigate(`/visits/${visit.id}/report`)}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "4px" }}>
                  {visit.siteName}
                </div>
                <div style={{ color: "var(--steel)", fontSize: "13px" }}>
                  Inspector: {visit.inspectorName}
                  {visit.notes && <span> &middot; {visit.notes}</span>}
                </div>
                <div style={{ color: "var(--steel)", fontSize: "12px", marginTop: "4px" }}>
                  {new Date(visit.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedVisitsPage;