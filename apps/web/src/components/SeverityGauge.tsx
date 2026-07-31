import React from "react";
import { Severity } from "@inspection/shared";

interface SeverityGaugeProps {
  severity: Severity;
}

const LEVELS: Severity[] = ["LOW", "MODERATE", "HIGH", "CRITICAL"];

export const SeverityGauge: React.FC<SeverityGaugeProps> = ({ severity }) => {
  return (
    <div className="gauge-section">
      <div className="gauge-label">Overall Severity Rating</div>
      <div className="gauge">
        {LEVELS.map((level) => {
          const isActive = level === severity;
          return (
            <div
              key={level}
              className={`gauge-seg ${isActive ? "active" : ""}`}
              data-level={level}
            >
              {level}
              {isActive && <div className="gauge-marker" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default SeverityGauge;
