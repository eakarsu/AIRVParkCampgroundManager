import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import { api } from '../api';

function AISiteMatching() {
  const [form, setForm] = useState({
    rig_type: '', rig_length: '', slides: '', amp_needed: '30', needs_sewer: false, budget_per_night: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/site-matching', form);
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
          <h2>AI Site Matching</h2>
          <p>Find the perfect campsite based on rig specifications and guest preferences.</p>
        </div>
        <div className="ai-form">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Rig Type</label>
                <select className="form-select" value={form.rig_type} onChange={e => setForm({ ...form, rig_type: e.target.value })}>
                  <option value="">Select rig type</option>
                  <option value="Class A">Class A</option>
                  <option value="Class B">Class B</option>
                  <option value="Class C">Class C</option>
                  <option value="Fifth Wheel">Fifth Wheel</option>
                  <option value="Travel Trailer">Travel Trailer</option>
                  <option value="Pop-up">Pop-up</option>
                  <option value="Tent">Tent</option>
                </select>
              </div>
              <div className="form-group">
                <label>Rig Length (ft)</label>
                <input className="form-input" type="number" value={form.rig_length} onChange={e => setForm({ ...form, rig_length: e.target.value })} placeholder="e.g., 35" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Number of Slides</label>
                <input className="form-input" type="number" value={form.slides} onChange={e => setForm({ ...form, slides: e.target.value })} placeholder="e.g., 2" />
              </div>
              <div className="form-group">
                <label>Amp Service Needed</label>
                <select className="form-select" value={form.amp_needed} onChange={e => setForm({ ...form, amp_needed: e.target.value })}>
                  <option value="30">30 Amp</option>
                  <option value="50">50 Amp</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Budget Per Night ($)</label>
                <input className="form-input" type="number" step="any" value={form.budget_per_night} onChange={e => setForm({ ...form, budget_per_night: e.target.value })} placeholder="e.g., 50" />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                <div className="form-checkbox-group">
                  <input type="checkbox" checked={form.needs_sewer} onChange={e => setForm({ ...form, needs_sewer: e.target.checked })} />
                  <label>Needs Sewer Hookup</label>
                </div>
              </div>
            </div>
            <button type="submit" className="ai-generate-btn" disabled={loading}>
              {loading ? 'Finding Matches...' : 'Find Best Sites'}
            </button>
          </form>
        </div>
        <AIOutput data={result} loading={loading} error={error} />
        {history.length > 1 && (
          <div className="ai-history">
            <h3>Previous Matches</h3>
            {history.slice(1).map((item, idx) => (
              <AIOutput key={idx} data={item} loading={false} error={null} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AISiteMatching;
