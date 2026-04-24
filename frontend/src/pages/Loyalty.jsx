import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function Loyalty() {
  const [data, setData] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [d, g] = await Promise.all([api.get('/loyalty'), api.get('/guests')]);
      setData(Array.isArray(d) ? d : (d.data || []));
      setGuests(Array.isArray(g) ? g : (g.data || []));
    } catch (e) { setError('Failed to load data'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getGuestName = (row) => { const g = guests.find(g => (g.id || g._id) == row.guest_id); return g ? `${g.first_name} ${g.last_name}` : row.guest_id || '-'; };

  const columns = [
    { key: 'guest_id', label: 'Guest', render: (v, row) => getGuestName(row) },
    { key: 'points', label: 'Points' },
    { key: 'action', label: 'Action', render: (v) => <span className={`status-badge ${v}`}>{v || '-'}</span> },
    { key: 'description', label: 'Description' },
    { key: 'created_at', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  const detailFields = [
    { key: 'guest_id', label: 'Guest ID' }, { key: 'points', label: 'Points', type: 'number' },
    { key: 'action', label: 'Action', type: 'badge' }, { key: 'description', label: 'Description', fullWidth: true },
    { key: 'created_at', label: 'Date', type: 'date' },
  ];

  const formFields = [
    { key: 'guest_id', label: 'Guest', type: 'select', required: true, options: guests.map(g => ({ value: g.id || g._id, label: `${g.first_name} ${g.last_name}` })) },
    { key: 'points', label: 'Points', type: 'number', required: true },
    { key: 'action', label: 'Action', type: 'select', required: true, options: [
      { value: 'earned', label: 'Earned' }, { value: 'redeemed', label: 'Redeemed' },
    ]},
    { key: 'description', label: 'Description', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/loyalty/${editData.id || editData._id}`, formData); }
      else { await api.post('/loyalty', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/loyalty/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Loyalty & Rewards" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Add Points" searchFields={['action', 'description']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title="Loyalty Record" data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Record' : 'Add Loyalty Points'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default Loyalty;
