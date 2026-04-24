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

  useEffect(() => {
    api.get('/sites').then(res => setSites(Array.isArray(res) ? res : (res.data || []))).catch(() => {});
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
          <p>Get AI-powered pricing recommendations based on demand, seasonality, and market conditions.</p>
        </div>
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
