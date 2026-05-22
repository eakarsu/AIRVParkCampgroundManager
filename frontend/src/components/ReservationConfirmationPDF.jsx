import React, { useState } from 'react';

function ReservationConfirmationPDF() {
  const [reservationId, setReservationId] = useState('1');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const downloadPdf = async () => {
    setLoading(true);
    setStatus('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/custom-views/reservation-confirmation-pdf?reservation_id=${encodeURIComponent(reservationId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        setStatus(`Error: HTTP ${res.status}`);
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reservation-${reservationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus(`Downloaded ${blob.size} bytes (application/pdf).`);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const previewInline = async () => {
    setStatus('');
    const token = localStorage.getItem('token');
    const url = `/api/custom-views/reservation-confirmation-pdf?reservation_id=${encodeURIComponent(reservationId)}`;
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const blob = await res.blob();
    const objUrl = window.URL.createObjectURL(blob);
    window.open(objUrl, '_blank');
  };

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
      <h3 style={{ margin: '0 0 14px', color: '#2E7D32' }}>Reservation Confirmation PDF</h3>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 14 }}>
        Generate a downloadable PDF confirmation for any reservation. Falls back to a demo confirmation if the ID is not found.
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Reservation ID</label>
          <input
            type="text"
            value={reservationId}
            onChange={(e) => setReservationId(e.target.value)}
            style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4, width: 180 }}
          />
        </div>
        <button
          onClick={downloadPdf}
          disabled={loading}
          style={{ padding: '8px 16px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          {loading ? 'Generating...' : 'Download PDF'}
        </button>
        <button
          onClick={previewInline}
          style={{ padding: '8px 16px', background: '#1976D2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          Preview in New Tab
        </button>
      </div>
      {status && (
        <div style={{ marginTop: 14, padding: 10, background: status.startsWith('Error') ? '#FFEBEE' : '#E8F5E9', borderRadius: 4, fontSize: 13 }}>
          {status}
        </div>
      )}
    </div>
  );
}

export default ReservationConfirmationPDF;
