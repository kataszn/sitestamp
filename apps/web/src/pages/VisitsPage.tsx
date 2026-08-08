import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { VisitDTO } from "@sitestamp/shared";

type Filter = "ALL" | "OPEN" | "COMPLETED";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "COMPLETED", label: "Completed" },
];

const isOpen = (v: VisitDTO) => v.status !== "COMPLETE";

export const VisitsPage: React.FC = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<VisitDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/v1";

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await fetch(`${apiBase}/visits`);
        if (response.ok || response.status === 304) {
          const allVisits: VisitDTO[] = await response.json();
          setVisits(allVisits);
        } else {
          console.warn("Unexpected response status:", response.status);
        }
      } catch (err) {
        console.error("Failed to fetch visits", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, [apiBase]);

  const filtered = visits.filter((v) => {
    if (filter === "OPEN") return isOpen(v);
    if (filter === "COMPLETED") return !isOpen(v);
    return true;
  });

  const openCount = visits.filter(isOpen).length;
  const completedCount = visits.length - openCount;

  const handleOpen = (visit: VisitDTO) => {
    // Completed visits open the report; open visits return to the detail page
    // so the user can keep adding evidence or generate a report.
    if (visit.status === "COMPLETE") {
      navigate(`/visits/${visit.id}/report`);
    } else {
      navigate(`/visits/${visit.id}`);
    }
  };

  if (loading) {
    return (
      <div className="report-page">
        <div className="state-message">Loading visits...</div>
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
            <span>{visits.length} total</span>
          </div>
          <h1 className="site-name">Visits</h1>
          <div className="meta-row">
            <button
              onClick={() => navigate("/")}
              className="btn-secondary"
              style={{ fontSize: "11px", padding: "6px 12px" }}
            >
              &larr; Back
            </button>
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: "8px", marginTop: "18px" }}>
            {FILTERS.map(({ key, label }) => {
              const count =
                key === "ALL" ? visits.length : key === "OPEN" ? openCount : completedCount;
              const active = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  style={{
                    fontFamily: "IBM Plex Mono, monospace",
                    fontSize: "11px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "6px 14px",
                    cursor: "pointer",
                    borderRadius: "2px",
                    border: active ? "1.5px solid var(--ink)" : "1.5px solid var(--line)",
                    background: active ? "var(--ink)" : "transparent",
                    color: active ? "var(--sheet)" : "var(--steel)",
                    transition: "background 0.15s, color 0.15s, border-color 0.15s",
                  }}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Visit list */}
        {filtered.length === 0 ? (
          <div className="section">
            <p style={{ color: "var(--steel)", fontSize: "14px", fontStyle: "italic", margin: 0 }}>
              {filter === "OPEN"
                ? "No open visits. Start a new inspection to begin."
                : filter === "COMPLETED"
                ? "No completed visits yet."
                : "No visits yet. Start a new inspection to begin."}
            </p>
          </div>
        ) : (
          <div style={{ padding: "16px 28px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map((visit) => {
              const open = isOpen(visit);
              return (
                <div
                  key={visit.id}
                  onClick={() => handleOpen(visit)}
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
                  <span className="status-pill" style={{ flexShrink: 0 }}>
                    {open ? "Open" : "Complete"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitsPage;
