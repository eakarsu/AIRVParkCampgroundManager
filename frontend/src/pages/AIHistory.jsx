import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import { api, recordsFromResponse } from '../api';

export default function AIHistory() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/ai/history')
      .then(response => {
        if (response.error) throw new Error(response.error);
        setItems(recordsFromResponse(response));
      })
      .catch(() => setError('Saved AI reports could not be loaded.'));
  }, []);

  const openReport = async id => {
    setLoading(true);
    setError('');
    try {
      const report = await api.get(`/ai/history/${id}`);
      if (report.error) throw new Error(report.error);
      setSelected(report);
    } catch {
      setError('The saved AI report could not be opened.');
    } finally {
      setLoading(false);
    }
  };

  return <><Navbar /><div className="page-container ai-workspace">
    <header className="ai-workspace-heading"><h1>Saved AI Reports</h1><p>Open a saved result to review its structured findings.</p></header>
    {error && <div className="ai-alert" role="alert">{error}</div>}
    <section className="ai-history" aria-label="Saved reports">
      {items.length === 0 && !error && <p>No saved AI reports are available.</p>}
      {items.map(item => <button key={item.id} type="button" className="ai-history-row" onClick={() => openReport(item.id)}>
        <strong>{String(item.feature || 'AI report').replace(/[-_]/g, ' ')}</strong>
        <span>{item.created_at ? new Date(item.created_at).toLocaleString() : 'Date unavailable'}</span>
      </button>)}
    </section>
    {loading && <p role="status">Opening saved report…</p>}
    {selected && <section aria-label="Saved report detail">
      <h2>{String(selected.feature || 'AI report').replace(/[-_]/g, ' ')}</h2>
      <AIOutput data={selected.result_json ?? selected.result_text} />
    </section>}
  </div></>;
}
