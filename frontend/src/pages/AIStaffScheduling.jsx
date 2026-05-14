import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import { api } from '../api';

function AIStaffScheduling() {
  const [horizonDays, setHorizonDays] = useState(7);
  const [teamSize, setTeamSize] = useState(6);
  const [constraints, setConstraints] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/staff-scheduling', {
        horizon_days: parseInt(horizonDays) || 7,
        team_size: parseInt(teamSize) || 6,
        constraints,
      });
      if (res.error) setError(res.error);
      else setResult(res);
    } catch (err) {
      if (err.status === 503) setError(err.data?.error || 'AI provider not configured. Set OPENROUTER_API_KEY.');
      else setError('Failed to generate schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="ai-section">
          <h2>AI Staff Scheduling</h2>
          <p>Propose a balanced staff schedule based on arrivals, maintenance load, and amenity coverage.</p>
        </div>

        <div className="ai-form">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Horizon (days)</label>
                <input className="form-input" type="number" min={1} max={30} value={horizonDays} onChange={e => setHorizonDays(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Team size</label>
                <input className="form-input" type="number" min={1} max={50} value={teamSize} onChange={e => setTeamSize(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Constraints (optional)</label>
              <textarea
                className="form-input"
                rows={3}
                value={constraints}
                onChange={e => setConstraints(e.target.value)}
                placeholder="e.g. no double-shifts, two staff on weekends, Alex unavailable Wed"
              />
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 6, margin: '10px 0' }}>{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Building schedule...' : 'Generate Schedule'}
            </button>
          </form>
        </div>

        {loading && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>AI is balancing shifts...</div>}
        {result && <AIOutput data={result} />}
      </div>
    </>
  );
}

export default AIStaffScheduling;
