import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface VisitFormProps {
  onSubmit: (data: { siteName: string; inspectorName: string; notes: string; assetCode: string }) => void;
  isLoading: boolean;
}

export const VisitForm: React.FC<VisitFormProps> = ({ onSubmit, isLoading }) => {
  const navigate = useNavigate();
  const [siteName, setSiteName] = useState("");
  const [inspectorName, setInspectorName] = useState("");
  const [notes, setNotes] = useState("");
  const [assetCode, setAssetCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim() || !inspectorName.trim()) return;
    onSubmit({ siteName, inspectorName, notes, assetCode });
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="form-group">
        <label htmlFor="siteName">Site Name *</label>
        <input
          id="siteName"
          type="text"
          className="form-control"
          placeholder="e.g. Brooklyn Bridge, South Abutment"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-field">
        <label htmlFor="assetCode">Asset Code (optional)  </label>
        <input
          id="assetCode"
          type="text"
          className="form-control"
          placeholder="e.g. BRG-MB-003"
          value={assetCode}
          onChange={(e) => setAssetCode(e.target.value)}
          disabled={isLoading}
        />
        <p className="field-hint">Use the same code across visits to the same asset to link inspection history.</p>
      </div>

      <div className="form-group">
        <label htmlFor="inspectorName">Inspector Name *</label>
        <input
          id="inspectorName"
          type="text"
          className="form-control"
          placeholder="e.g. Jane Doe"
          value={inspectorName}
          onChange={(e) => setInspectorName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Inspector Notes (Optional)</label>
        <textarea
          id="notes"
          className="form-control"
          placeholder="Focus areas, site weather, accessibility notes..."
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <button type="submit" className="btn" disabled={isLoading || !siteName.trim() || !inspectorName.trim()}>
          {isLoading ? "Starting Visit..." : "Start Visit"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => navigate("/visits")}>
          View Visits
        </button>
      </div>
    </form>
  );
};

export default VisitForm;
