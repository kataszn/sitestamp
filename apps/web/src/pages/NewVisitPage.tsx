import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import VisitForm from "../components/VisitForm";
import { useToast } from "../components/Toast";

export const NewVisitPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateVisit = async (data: { siteName: string; inspectorName: string; notes: string; assetCode: string }) => {
    setIsLoading(true);
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/v1";

    try {
      const response = await fetch(`${apiBase}/visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create visit");
      }

      const visit = await response.json();
      navigate(`/visits/${visit.id}`);
    } catch (err) {
      console.error(err);
      showToast("Error starting new visit. Is the API server running?", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="report-page">
      <div className="sheet" style={{ padding: "40px 28px" }}>
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "28px", margin: "0 0 8px" }}>
          New Inspection Visit
        </h1>
        <p style={{ color: "var(--steel)", fontSize: "14px", margin: "0 0 24px" }}>
          Start a new site visit. Once created, you will be able to record evidence photos and voice notes.
        </p>
        <VisitForm onSubmit={handleCreateVisit} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default NewVisitPage;
