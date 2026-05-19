import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import { api } from '../api';

function AIDynamicPricing() {
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({ site_id: '', season: 'summer', events_nearby: '', weather: '', current_rate: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [occupancyStats, setOccupancyStats] = useState(null);

  useEffect(() => {
    api.get('/sites').then(res => {
      const siteList = Array.isArray(res) ? res : (res.data || []);
      setSites(siteList);
      const available = siteList.filter(s => s.status === 'available').length;
      const total = siteList.length || 1;
      setOccupancyStats({
        total,
        available,
        occupied: total - available,
        occupancy_rate: Math.round(((total - available) / total) * 100)
      });
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/dynamic-pricing', form);
      if (res.error) { setError(res.error); }
      else { setResult(res); setHistory(prev => [{ ...res, timestamp: new Date().toLocaleString() }, ...prev]); }
    } catch (e) { setError('Failed to get AI analysis. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="ai-section">
          <h2>AI Dynamic Pricing</h2>
          <p>Get AI-powered pricing recommendations grounded with real-time occupancy data from your database.</p>
        </div>

        {/* Occupancy Stats Panel */}
        {occupancyStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Total Sites', value: occupancyStats.total, color: '#6366f1' },
              { label: 'Available', value: occupancyStats.available, color: '#22c55e' },
              { label: 'Occupied', value: occupancyStats.occupied, color: '#ef4444' },
              { label: 'Occupancy Rate', value: `${occupancyStats.occupancy_rate}%`, color: occupancyStats.occupancy_rate >= 80 ? '#ef4444' : occupancyStats.occupancy_rate >= 60 ? '#eab308' : '#22c55e' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {result?.occupancy_rate !== undefined && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#1e40af' }}>
            <strong>Live Occupancy at time of analysis:</strong> {result.occupancy_rate}% — AI pricing factored this into the recommendation.
          </div>
        )}
        <div className="ai-form">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Site</label>
                <select className="form-select" value={form.site_id} onChange={e => setForm({ ...form, site_id: e.target.value })}>
                  <option value="">Select a site</option>
                  {sites.map(s => <option key={s.id || s._id} value={s.id || s._id}>Site {s.site_number} ({s.type})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Season</label>
                <select className="form-select" value={form.season} onChange={e => setForm({ ...form, season: e.target.value })}>
                  <option value="spring">Spring</option>
                  <option value="summer">Summer</option>
                  <option value="fall">Fall</option>
                  <option value="winter">Winter</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Events Nearby</label>
                <input className="form-input" value={form.events_nearby} onChange={e => setForm({ ...form, events_nearby: e.target.value })} placeholder="e.g., Music festival, Holiday weekend" />
              </div>
              <div className="form-group">
                <label>Weather Conditions</label>
                <input className="form-input" value={form.weather} onChange={e => setForm({ ...form, weather: e.target.value })} placeholder="e.g., Sunny, 75F" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Current Rate ($)</label>
                <input className="form-input" type="number" step="any" value={form.current_rate} onChange={e => setForm({ ...form, current_rate: e.target.value })} placeholder="45.00" />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="ai-generate-btn" disabled={loading}>
                  {loading ? 'Analyzing...' : 'Generate Pricing'}
                </button>
              </div>
            </div>
          </form>
        </div>
        <AIOutput data={result} loading={loading} error={error} />
        {history.length > 1 && (
          <div className="ai-history">
            <h3>Previous Results</h3>
            {history.slice(1).map((item, idx) => (
              <AIOutput key={idx} data={item} loading={false} error={null} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AIDynamicPricing;
