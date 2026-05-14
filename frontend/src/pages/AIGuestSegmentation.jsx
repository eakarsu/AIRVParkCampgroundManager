import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import { api } from '../api';

function AIGuestSegmentation() {
  const [numSegments, setNumSegments] = useState(5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/guest-segmentation', {
        num_segments: parseInt(numSegments) || 5,
      });
      if (res.error) setError(res.error);
      else setResult(res);
    } catch (err) {
      if (err.status === 503) setError(err.data?.error || 'AI provider not configured. Set OPENROUTER_API_KEY.');
      else setError('Failed to segment guests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="ai-section">
          <h2>AI Guest Segmentation</h2>
          <p>Cluster guests into actionable marketing segments with offer and channel recommendations.</p>
        </div>

        <div className="ai-form">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Number of segments</label>
                <input
                  className="form-input"
                  type="number"
                  min={2}
                  max={10}
                  value={numSegments}
                  onChange={e => setNumSegments(e.target.value)}
                />
              </div>
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 6, margin: '10px 0' }}>{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Segmenting...' : 'Generate Segments'}
            </button>
          </form>
        </div>

        {loading && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>AI is clustering guests...</div>}
        {result && <AIOutput data={result} />}
      </div>
    </>
  );
}

export default AIGuestSegmentation;
