import React, { useState, useEffect } from 'react';
import { api } from '../api';

function SiteUtilizationHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(14);

  useEffect(() => {
    setLoading(true);
    api.get(`/custom-views/site-utilization-heatmap?days=${days}`)
      .then(res => { setData(res); setError(null); })
      .catch(e => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div style={{ padding: 20 }}>Loading heatmap...</div>;
  if (error) return <div style={{ padding: 20, color: '#D32F2F' }}>Error: {error}</div>;
  if (!data) return null;

  const colorFor = (u) => {
    if (u >= 0.9) return '#1B5E20';
    if (u >= 0.7) return '#388E3C';
    if (u >= 0.4) return '#FBC02D';
    if (u > 0) return '#FFE082';
    return '#F5F5F5';
  };

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, color: '#2E7D32' }}>Site Utilization Heatmap</h3>
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))} style={{ padding: 6 }}>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={21}>21 days</option>
          <option value={30}>30 days</option>
        </select>
      </div>
      <div style={{ fontSize: 12, marginBottom: 8, color: '#666' }}>
        {data.site_count} sites × {data.days} days. Hover cells for details.
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ padding: 4, textAlign: 'left', position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>Site</th>
              {data.dates.map(d => (
                <th key={d} style={{ padding: 2, fontWeight: 400, color: '#666', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 50 }}>{d.slice(5)}</th>
              ))}
              <th style={{ padding: 4, color: '#666' }}>Avg</th>
            </tr>
          </thead>
          <tbody>
            {data.sites.map(s => (
              <tr key={s.site_id}>
                <td style={{ padding: 4, fontWeight: 600, position: 'sticky', left: 0, background: '#fff' }}>{s.site_number}<br/><span style={{ fontSize: 9, color: '#999' }}>{s.type}</span></td>
                {s.cells.map(c => (
                  <td key={c.date} title={`${s.site_number} on ${c.date}: ${c.status} (${Math.round(c.utilization * 100)}%)`}
                      style={{ width: 22, height: 22, background: colorFor(c.utilization), border: '1px solid #fff' }} />
                ))}
                <td style={{ padding: 4, textAlign: 'center', fontWeight: 600 }}>{Math.round(s.avg_utilization * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, alignItems: 'center' }}>
        <span>Low</span>
        {[0, 0.3, 0.5, 0.75, 0.95].map(v => (
          <div key={v} style={{ width: 20, height: 14, background: colorFor(v), border: '1px solid #ddd' }} />
        ))}
        <span>High</span>
      </div>
    </div>
  );
}

export default SiteUtilizationHeatmap;
