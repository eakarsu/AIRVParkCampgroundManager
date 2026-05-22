import React, { useState, useEffect } from 'react';
import { api } from '../api';

const emptyRule = {
  name: '',
  type: 'season',
  season_start: '',
  season_end: '',
  multiplier: 1.0,
  min_nights: 1,
  max_nights: 30,
  notes: ''
};

function PricingRulesEditor() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyRule);

  const load = () => {
    setLoading(true);
    api.get('/custom-views/pricing-rules')
      .then(res => { setRules(res.rules || []); setError(null); })
      .catch(e => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const startCreate = () => { setEditing('new'); setForm(emptyRule); };
  const startEdit = (rule) => {
    setEditing(rule.id);
    setForm({
      name: rule.name || '',
      type: rule.type || 'season',
      season_start: rule.season_start || '',
      season_end: rule.season_end || '',
      multiplier: rule.multiplier ?? 1.0,
      min_nights: rule.min_nights ?? 1,
      max_nights: rule.max_nights ?? 30,
      notes: rule.notes || ''
    });
  };
  const cancel = () => { setEditing(null); setForm(emptyRule); };

  const save = async () => {
    try {
      if (editing === 'new') {
        await api.post('/custom-views/pricing-rules', form);
      } else {
        await api.put(`/custom-views/pricing-rules/${editing}`, form);
      }
      cancel();
      load();
    } catch (e) {
      alert('Save failed: ' + (e.message || e));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await api.delete(`/custom-views/pricing-rules/${id}`);
      load();
    } catch (e) {
      alert('Delete failed: ' + (e.message || e));
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading rules...</div>;
  if (error) return <div style={{ padding: 20, color: '#D32F2F' }}>Error: {error}</div>;

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, color: '#2E7D32' }}>Booking & Pricing Rules</h3>
        <button onClick={startCreate} style={{ padding: '8px 16px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          + Add Rule
        </button>
      </div>

      {editing !== null && (
        <div style={{ background: '#F1F8E9', padding: 14, borderRadius: 6, marginBottom: 16, border: '1px solid #C5E1A5' }}>
          <h4 style={{ marginTop: 0 }}>{editing === 'new' ? 'New Rule' : `Edit Rule #${editing}`}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} /></label>
            <label>Type
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}>
                <option value="season">Season</option>
                <option value="length_of_stay">Length of Stay</option>
              </select>
            </label>
            <label>Season Start<input type="date" value={form.season_start || ''} onChange={e => setForm({ ...form, season_start: e.target.value })} style={inp} /></label>
            <label>Season End<input type="date" value={form.season_end || ''} onChange={e => setForm({ ...form, season_end: e.target.value })} style={inp} /></label>
            <label>Multiplier<input type="number" step="0.01" value={form.multiplier} onChange={e => setForm({ ...form, multiplier: e.target.value })} style={inp} /></label>
            <label>Min Nights<input type="number" value={form.min_nights} onChange={e => setForm({ ...form, min_nights: e.target.value })} style={inp} /></label>
            <label>Max Nights<input type="number" value={form.max_nights} onChange={e => setForm({ ...form, max_nights: e.target.value })} style={inp} /></label>
            <label style={{ gridColumn: '1 / 3' }}>Notes<input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inp} /></label>
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={save} style={{ padding: '8px 16px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: 4, marginRight: 8, cursor: 'pointer' }}>Save</button>
            <button onClick={cancel} style={{ padding: '8px 16px', background: '#757575', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#F5F5F5' }}>
            <th style={th}>ID</th><th style={th}>Name</th><th style={th}>Type</th>
            <th style={th}>Season</th><th style={th}>Multiplier</th>
            <th style={th}>Nights</th><th style={th}>Notes</th><th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={td}>{r.id}</td>
              <td style={td}><strong>{r.name}</strong></td>
              <td style={td}>{r.type}</td>
              <td style={td}>{r.season_start ? `${r.season_start} → ${r.season_end}` : '—'}</td>
              <td style={td}>×{Number(r.multiplier).toFixed(2)}</td>
              <td style={td}>{r.min_nights}–{r.max_nights}</td>
              <td style={td}>{r.notes}</td>
              <td style={td}>
                <button onClick={() => startEdit(r)} style={btnSm}>Edit</button>{' '}
                <button onClick={() => remove(r.id)} style={{ ...btnSm, background: '#D32F2F' }}>Delete</button>
              </td>
            </tr>
          ))}
          {rules.length === 0 && <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: '#999' }}>No rules yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const inp = { width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 4, marginTop: 2, display: 'block' };
const th = { padding: 8, textAlign: 'left', borderBottom: '2px solid #ddd' };
const td = { padding: 8, verticalAlign: 'top' };
const btnSm = { padding: '4px 10px', background: '#1976D2', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 12 };

export default PricingRulesEditor;
