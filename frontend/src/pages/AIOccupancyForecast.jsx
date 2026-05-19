import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import { api } from '../api';

function AIOccupancyForecast() {
  const [days, setDays] = useState(14);
  const [includePromos, setIncludePromos] = useState(true);
  const [eventsNearby, setEventsNearby] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/occupancy-forecast', {
        days: Number(days),
        include_promos: includePromos,
        events_nearby: eventsNearby,
      });
      if (res.error) setError(res.error);
      else setResult(res);
    } catch (err) {
      setError('Failed to get forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="ai-section">
          <h2>AI Occupancy Forecast</h2>
          <p>N-day occupancy forecast over historical + on-the-books reservations with promo recommendations for soft dates.</p>
        </div>

        <div className="ai-form">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Forecast horizon (days)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="120"
                  value={days}
                  onChange={e => setDays(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Include promo recommendations?</label>
                <select className="form-select" value={String(includePromos)} onChange={e => setIncludePromos(e.target.value === 'true')}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Local events / context (optional)</label>
              <textarea
                className="form-input"
                rows={3}
                value={eventsNearby}
                onChange={e => setEventsNearby(e.target.value)}
                placeholder="e.g. county fair Aug 12-14, music festival the weekend after"
              />
            </div>

            {error && <div className="error-message" style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 6, margin: '10px 0' }}>{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Forecasting...' : 'Generate Forecast'}
            </button>
          </form>
        </div>

        {loading && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>AI is analyzing reservations data...</div>}
        {result && <AIOutput data={result} />}
      </div>
    </>
  );
}

export default AIOccupancyForecast;
