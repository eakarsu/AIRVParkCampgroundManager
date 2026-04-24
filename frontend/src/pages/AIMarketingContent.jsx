import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import { api } from '../api';

function AIMarketingContent() {
  const [form, setForm] = useState({
    campaign_type: 'email', season: 'summer', target_audience: 'families', special_offers: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/marketing-content', form);
      if (res.error) { setError(res.error); }
      else { setResult(res); setHistory(prev => [{ ...res, timestamp: new Date().toLocaleString() }, ...prev]); }
    } catch (e) { setError('Failed to generate content. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="ai-section">
          <h2>AI Marketing Content Generator</h2>
          <p>Generate compelling marketing copy for emails, social media, flyers, and more.</p>
        </div>
        <div className="ai-form">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Campaign Type</label>
                <select className="form-select" value={form.campaign_type} onChange={e => setForm({ ...form, campaign_type: e.target.value })}>
                  <option value="email">Email Campaign</option>
                  <option value="social">Social Media</option>
                  <option value="flyer">Flyer / Print</option>
                  <option value="website">Website Copy</option>
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
            <div className="form-group">
              <label>Target Audience</label>
              <select className="form-select" value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })}>
                <option value="families">Families</option>
                <option value="retirees">Retirees</option>
                <option value="adventure">Adventure Seekers</option>
                <option value="snowbirds">Snowbirds</option>
              </select>
            </div>
            <div className="form-group">
              <label>Special Offers</label>
              <textarea className="form-textarea" value={form.special_offers} onChange={e => setForm({ ...form, special_offers: e.target.value })}
                placeholder="e.g., 20% off weekly stays, free firewood bundle with reservation..." />
            </div>
            <button type="submit" className="ai-generate-btn" disabled={loading}>
              {loading ? 'Creating Content...' : 'Generate Content'}
            </button>
          </form>
        </div>
        <AIOutput data={result} loading={loading} error={error} />
        {history.length > 1 && (
          <div className="ai-history">
            <h3>Previous Content</h3>
            {history.slice(1).map((item, idx) => (
              <AIOutput key={idx} data={item} loading={false} error={null} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AIMarketingContent;
