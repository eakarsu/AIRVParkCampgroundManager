import React, { useState, useEffect } from 'react';
import { api } from '../api';

function OccupancyTimeline() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    api.get(`/custom-views/occupancy-timeline?days=${days}`)
      .then(res => { setData(res); setError(null); })
      .catch(e => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div style={{ padding: 20 }}>Loading occupancy timeline...</div>;
  if (error) return <div style={{ padding: 20, color: '#D32F2F' }}>Error: {error}</div>;
  if (!data) return null;

  const maxPct = 100;
  const barW = 22;
  const chartH = 220;

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, color: '#2E7D32' }}>Occupancy Timeline</h3>
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))} style={{ padding: 6 }}>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
          <option value={60}>60 days</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13 }}>
        <div><strong>Avg:</strong> {data.summary.avg_occupancy_pct}%</div>
        <div><strong>Total Sites:</strong> {data.summary.total_sites}</div>
        <div><strong>Peak:</strong> {data.summary.peak_date}</div>
        <div><strong>Low:</strong> {data.summary.low_date}</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg width={data.timeline.length * (barW + 4) + 40} height={chartH + 60} style={{ display: 'block' }}>
          {[0, 25, 50, 75, 100].map(g => (
            <g key={g}>
              <line x1={30} x2={data.timeline.length * (barW + 4) + 30} y1={chartH - (g / maxPct) * chartH + 10} y2={chartH - (g / maxPct) * chartH + 10} stroke="#eee" />
              <text x={2} y={chartH - (g / maxPct) * chartH + 14} fontSize={10} fill="#666">{g}%</text>
            </g>
          ))}
          {data.timeline.map((d, i) => {
            const h = (d.occupancy_pct / maxPct) * chartH;
            const color = d.occupancy_pct >= 80 ? '#D32F2F' : d.occupancy_pct >= 50 ? '#F57F17' : '#388E3C';
            return (
              <g key={d.date}>
                <rect x={30 + i * (barW + 4)} y={chartH - h + 10} width={barW} height={h} fill={color} rx={2}>
                  <title>{d.date}: {d.occupancy_pct}% ({d.occupied}/{d.total})</title>
                </rect>
                <text x={30 + i * (barW + 4) + barW / 2} y={chartH + 24} fontSize={9} fill="#666" textAnchor="middle">{d.date.slice(5)}</text>
                <text x={30 + i * (barW + 4) + barW / 2} y={chartH + 38} fontSize={9} fill="#999" textAnchor="middle">{d.day_of_week}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default OccupancyTimeline;
