import React from "react";
import { DefectData } from "@inspectai/shared";

interface DefectItemProps {
  defect: DefectData;
  index: number;
  selected: boolean;
  onClick: () => void;
}

export const DefectItem: React.FC<DefectItemProps> = ({ defect, index, selected, onClick }) => {
  const formattedIndex = String(index + 1).padStart(2, "0");

  return (
    <div
      className={`defect${selected ? ' selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    >
      <div className="defect-num">{formattedIndex}</div>
      <div className="defect-body">
        <div className="defect-head">
          <div className="defect-type">{defect.type}</div>
          <div className="defect-tag" data-level={defect.severity}>
            {defect.severity}
          </div>
        </div>
        <div className="defect-loc">{defect.location}</div>
        <p className="defect-desc">{defect.description}</p>
      </div>
    </div>
  );
};
export default DefectItem;
