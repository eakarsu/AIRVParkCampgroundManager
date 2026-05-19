import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import { api } from '../api';

function AIAmenityDemandPrediction() {
  const [horizonDays, setHorizonDays] = useState(14);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/amenity-demand-prediction', {
        horizon_days: parseInt(horizonDays) || 14,
      });
      if (res.error) setError(res.error);
      else setResult(res);
    } catch (err) {
      if (err.status === 503) setError(err.data?.error || 'AI provider not configured. Set OPENROUTER_API_KEY.');
      else setError('Failed to forecast demand. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="ai-section">
          <h2>AI Amenity Demand Prediction</h2>
          <p>Forecast amenity usage and recommend stocking, staffing, and capacity adjustments.</p>
        </div>

        <div className="ai-form">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Horizon (days)</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={60}
                  value={horizonDays}
                  onChange={e => setHorizonDays(e.target.value)}
                />
              </div>
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 6, margin: '10px 0' }}>{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Forecasting...' : 'Predict Demand'}
            </button>
          </form>
        </div>

        {loading && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>AI is forecasting amenity demand...</div>}
        {result && <AIOutput data={result} />}
      </div>
    </>
  );
}

export default AIAmenityDemandPrediction;
