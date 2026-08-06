import type { HistoricalAssessment as HistoricalAssessmentData, TrendPoint } from '@sitestamp/shared';
import { TrendChart } from './TrendChart';

const TREND_LABEL: Record<string, string> = {
  IMPROVING: '↓ Improving',
  STABLE: '→ Stable',
  DETERIORATING: '↑ Deteriorating',
};

export function HistoricalAssessment({
  data,
  trendPoints,
}: {
  data: HistoricalAssessmentData;
  trendPoints?: TrendPoint[];
}) {
  return (
    <div className="section">
      <h2 className="section-title">Historical Comparison</h2>
      <div className="trend-row">
        <span className="trend-badge" data-trend={data.trend}>
          {TREND_LABEL[data.trend] ?? data.trend}
        </span>
        <span className="trend-meta">
          Based on {data.priorVisitCount} prior visit{data.priorVisitCount === 1 ? '' : 's'} to this asset
        </span>
      </div>
      {trendPoints && trendPoints.length > 1 && <TrendChart points={trendPoints} />}
      <p className="summary-text" style={{ marginTop: trendPoints ? '16px' : 0 }}>
        {data.narrative}
      </p>
    </div>
  );
}