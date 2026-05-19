import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import { api } from '../api';

function AICancellationRisk() {
  const [reservations, setReservations] = useState([]);
  const [reservationId, setReservationId] = useState('');
  const [recentBehavior, setRecentBehavior] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/reservations')
      .then(res => {
        const list = Array.isArray(res) ? res : (res.data || []);
        setReservations(list);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reservationId) {
      setError('Please select a reservation.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/cancellation-risk', {
        reservation_id: reservationId,
        recent_behavior: recentBehavior,
      });
      if (res.error) setError(res.error);
      else setResult(res);
    } catch (err) {
      setError('Failed to compute risk. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (band) => {
    const s = String(band || '').toLowerCase();
    if (s.includes('high') || s.includes('critical')) return '#ef4444';
    if (s.includes('medium') || s.includes('moderate')) return '#eab308';
    return '#22c55e';
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="ai-section">
          <h2>AI Cancellation Risk</h2>
          <p>Risk band, drivers, and retention interventions for a specific reservation.</p>
        </div>

        <div className="ai-form">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Reservation</label>
                <select className="form-select" value={reservationId} onChange={e => setReservationId(e.target.value)}>
                  <option value="">Select a reservation</option>
                  {reservations.map(r => (
                    <option key={r.id || r._id} value={r.id || r._id}>
                      {r.guest_name || r.guestName || `Res #${r.id}`} - {r.check_in_date || r.checkInDate || ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Recent behavior / signals (optional)</label>
              <textarea
                className="form-input"
                rows={3}
                value={recentBehavior}
                onChange={e => setRecentBehavior(e.target.value)}
                placeholder="e.g. asked about refund policy, weather forecast turning bad, schedule conflict"
              />
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 6, margin: '10px 0' }}>{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Scoring...' : 'Score Cancellation Risk'}
            </button>
          </form>
        </div>

        {loading && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>AI is computing cancellation risk...</div>}

        {result && (result.risk_band || result.riskBand) && (
          <div style={{
            background: '#1e293b',
            border: `2px solid ${riskColor(result.risk_band || result.riskBand)}`,
            borderRadius: 8,
            padding: 16,
            margin: '16px 0',
            display: 'flex',
            gap: 12,
            alignItems: 'center'
          }}>
            <span style={{
              padding: '6px 14px',
              borderRadius: 12,
              background: riskColor(result.risk_band || result.riskBand) + '22',
              color: riskColor(result.risk_band || result.riskBand),
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: 13,
            }}>
              {result.risk_band || result.riskBand}
            </span>
            {result.score != null && <span style={{ color: '#cbd5e1' }}>Score: {result.score}</span>}
          </div>
        )}

        {result && <AIOutput data={result} />}
      </div>
    </>
  );
}

export default AICancellationRisk;
