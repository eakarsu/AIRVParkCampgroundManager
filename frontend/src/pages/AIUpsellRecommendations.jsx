import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import { api } from '../api';

function AIUpsellRecommendations() {
  const [reservations, setReservations] = useState([]);
  const [reservationId, setReservationId] = useState('');
  const [channel, setChannel] = useState('email');
  const [budgetTier, setBudgetTier] = useState('mid');
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
      const res = await api.post('/ai/upsell-recommendations', {
        reservation_id: reservationId,
        channel,
        budget_tier: budgetTier,
      });
      if (res.error) setError(res.error);
      else setResult(res);
    } catch (err) {
      setError('Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="ai-section">
          <h2>AI Upsell Recommendations</h2>
          <p>Ranked add-on suggestions per reservation, with channel-specific message drafts.</p>
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
              <div className="form-group">
                <label>Channel</label>
                <select className="form-select" value={channel} onChange={e => setChannel(e.target.value)}>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="inperson">In-person</option>
                  <option value="app">App push</option>
                </select>
              </div>
              <div className="form-group">
                <label>Budget tier</label>
                <select className="form-select" value={budgetTier} onChange={e => setBudgetTier(e.target.value)}>
                  <option value="value">Value</option>
                  <option value="mid">Mid</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 6, margin: '10px 0' }}>{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Generating...' : 'Get Upsell Recommendations'}
            </button>
          </form>
        </div>

        {loading && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>AI is analyzing the reservation...</div>}
        {result && <AIOutput data={result} />}
      </div>
    </>
  );
}

export default AIUpsellRecommendations;
