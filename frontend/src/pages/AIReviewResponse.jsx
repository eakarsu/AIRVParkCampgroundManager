import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import { api } from '../api';

function AIReviewResponse() {
  const [form, setForm] = useState({ review_text: '', rating: '5', guest_name: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/review-response', form);
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
          <h2>AI Review Response Generator</h2>
          <p>Generate professional, thoughtful responses to guest reviews using AI.</p>
        </div>
        <div className="ai-form">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Guest Name</label>
                <input className="form-input" value={form.guest_name} onChange={e => setForm({ ...form, guest_name: e.target.value })} placeholder="Guest name" />
              </div>
              <div className="form-group">
                <label>Rating</label>
                <select className="form-select" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })}>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Review Text</label>
              <textarea className="form-textarea" value={form.review_text} onChange={e => setForm({ ...form, review_text: e.target.value })}
                placeholder="Paste the guest review here..." style={{ minHeight: '120px' }} />
            </div>
            <button type="submit" className="ai-generate-btn" disabled={loading || !form.review_text}>
              {loading ? 'Generating...' : 'Generate Response'}
            </button>
          </form>
        </div>
        <AIOutput data={result} loading={loading} error={error} />
        {history.length > 1 && (
          <div className="ai-history">
            <h3>Previous Responses</h3>
            {history.slice(1).map((item, idx) => (
              <AIOutput key={idx} data={item} loading={false} error={null} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AIReviewResponse;
