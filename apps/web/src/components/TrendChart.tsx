import type { TrendPoint } from '@sitestamp/shared';

const LEVEL: Record<string, number> = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };
const MAX_BAR_HEIGHT = 56; // px

export function TrendChart({ points }: { points: TrendPoint[] }) {
  return (
    <div className="trend-chart">
      {points.map((p, i) => {
        const height = ((LEVEL[p.severity] ?? 0) / 4) * MAX_BAR_HEIGHT;
        return (
          <div className="trend-point" key={i}>
            <div
              className={`trend-bar${p.isCurrent ? ' current' : ''}`}
              data-level={p.severity}
              style={{ height: `${height}px` }}
              title={`${p.severity} — ${p.date}`}
            />
            <span className="trend-point-label">{p.isCurrent ? 'Now' : p.date}</span>
          </div>
        );
      })}
    </div>
  );
}