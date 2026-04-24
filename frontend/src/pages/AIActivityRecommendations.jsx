import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import { api } from '../api';

function AIActivityRecommendations() {
  const [form, setForm] = useState({ location: '', season: 'summer', guest_preferences: '', family_friendly: true });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/activity-recommendations', form);
      if (res.error) { setError(res.error); }
      else { setResult(res); setHistory(prev => [{ ...res, timestamp: new Date().toLocaleString() }, ...prev]); }
    } catch (e) { setError('Failed to get AI recommendations. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="ai-section">
          <h2>AI Activity Recommendations</h2>
          <p>Get personalized activity and attraction recommendations for your guests.</p>
        </div>
        <div className="ai-form">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g., Smoky Mountains, TN" />
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
            <div className="form-group">
              <label>Guest Preferences</label>
              <textarea className="form-textarea" value={form.guest_preferences} onChange={e => setForm({ ...form, guest_preferences: e.target.value })}
                placeholder="e.g., Hiking, fishing, nature photography, quiet evenings..." />
            </div>
            <div className="form-group">
              <div className="form-checkbox-group">
                <input type="checkbox" checked={form.family_friendly} onChange={e => setForm({ ...form, family_friendly: e.target.checked })} />
                <label>Family Friendly Only</label>
              </div>
            </div>
            <button type="submit" className="ai-generate-btn" disabled={loading}>
              {loading ? 'Generating...' : 'Get Recommendations'}
            </button>
          </form>
        </div>
        <AIOutput data={result} loading={loading} error={error} />
        {history.length > 1 && (
          <div className="ai-history">
            <h3>Previous Recommendations</h3>
            {history.slice(1).map((item, idx) => (
              <AIOutput key={idx} data={item} loading={false} error={null} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AIActivityRecommendations;
