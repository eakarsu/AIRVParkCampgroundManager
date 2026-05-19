import React, { useState, useEffect } from 'react';
import { api } from '../api';

function AvailabilityCalendar() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [calData, setCalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/sites/availability?start=${startDate}&end=${endDate}`);
      setCalData(res);
    } catch (e) {
      setError(e.message || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const getCellColor = (avail) => {
    if (!avail) return '#374151';
    if (avail.status === 'booked') return '#dc2626';
    if (avail.status === 'available') return '#16a34a';
    if (avail.status === 'maintenance') return '#d97706';
    return '#374151';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ marginBottom: '24px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
      <h3 style={{ marginBottom: '16px', color: '#f1f5f9' }}>Availability Calendar</h3>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: '6px', padding: '6px 10px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: '6px', padding: '6px 10px' }} />
        </div>
        <button onClick={loadAvailability} disabled={loading}
          style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8', alignItems: 'center' }}>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#16a34a', borderRadius: '2px', marginRight: '4px' }} />Available</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#dc2626', borderRadius: '2px', marginRight: '4px' }} />Booked</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#d97706', borderRadius: '2px', marginRight: '4px' }} />Maintenance</span>
        </div>
      </div>

      {error && <div style={{ color: '#f87171', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}

      {calData && calData.sites && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: '100%', fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{ padding: '6px 10px', background: '#0f172a', color: '#94a3b8', textAlign: 'left', position: 'sticky', left: 0, zIndex: 1, minWidth: '80px' }}>
                  Site
                </th>
                {calData.dates.map(d => (
                  <th key={d} style={{ padding: '4px 2px', background: '#0f172a', color: '#94a3b8', textAlign: 'center', minWidth: '36px', whiteSpace: 'nowrap' }}>
                    {formatDate(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calData.sites.map(site => (
                <tr key={site.site_id}>
                  <td style={{ padding: '4px 10px', background: '#1e293b', color: '#e2e8f0', fontWeight: 600, position: 'sticky', left: 0, borderRight: '1px solid #334155' }}>
                    {site.site_number}
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>{site.type}</div>
                  </td>
                  {calData.dates.map(d => {
                    const avail = site.availability[d];
                    return (
                      <td key={d} style={{ padding: '2px', textAlign: 'center' }}>
                        <div
                          title={avail?.status === 'booked' ? `Booked: ${avail.guest || 'Guest'}` : avail?.status}
                          style={{
                            width: '32px', height: '24px', borderRadius: '3px',
                            background: getCellColor(avail),
                            margin: '0 auto', cursor: 'pointer'
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AvailabilityCalendar;
