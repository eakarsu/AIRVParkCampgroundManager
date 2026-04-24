import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import { api } from '../api';

function AIMaintenancePrediction() {
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({
    site_id: '', site_age_years: '', last_maintenance: '', equipment_list: '', weather_conditions: ''
  });
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
      const res = await api.post('/ai/maintenance-prediction', form);
      if (res.error) { setError(res.error); }
      else { setResult(res); setHistory(prev => [{ ...res, timestamp: new Date().toLocaleString() }, ...prev]); }
    } catch (e) { setError('Failed to get AI predictions. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="ai-section">
          <h2>AI Maintenance Prediction</h2>
          <p>Predict upcoming maintenance needs and prevent costly breakdowns with AI analysis.</p>
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
                <label>Site Age (years)</label>
                <input className="form-input" type="number" value={form.site_age_years} onChange={e => setForm({ ...form, site_age_years: e.target.value })} placeholder="e.g., 5" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Last Maintenance Date</label>
                <input className="form-input" type="date" value={form.last_maintenance} onChange={e => setForm({ ...form, last_maintenance: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Weather Conditions</label>
                <input className="form-input" value={form.weather_conditions} onChange={e => setForm({ ...form, weather_conditions: e.target.value })} placeholder="e.g., Heavy rain season, freezing temps" />
              </div>
            </div>
            <div className="form-group">
              <label>Equipment List</label>
              <textarea className="form-textarea" value={form.equipment_list} onChange={e => setForm({ ...form, equipment_list: e.target.value })}
                placeholder="e.g., Water heater (3yr), Electrical panel (10yr), Sewer line (8yr), Concrete pad..." />
            </div>
            <button type="submit" className="ai-generate-btn" disabled={loading}>
              {loading ? 'Analyzing...' : 'Predict Maintenance Needs'}
            </button>
          </form>
        </div>
        <AIOutput data={result} loading={loading} error={error} />
        {history.length > 1 && (
          <div className="ai-history">
            <h3>Previous Predictions</h3>
            {history.slice(1).map((item, idx) => (
              <AIOutput key={idx} data={item} loading={false} error={null} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AIMaintenancePrediction;
