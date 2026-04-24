import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function Security() {
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
      const [d, g] = await Promise.all([api.get('/security'), api.get('/guests')]);
      setData(Array.isArray(d) ? d : (d.data || []));
      setGuests(Array.isArray(g) ? g : (g.data || []));
    } catch (e) { setError('Failed to load data'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getGuestName = (row) => { const g = guests.find(g => (g.id || g._id) == row.guest_id); return g ? `${g.first_name} ${g.last_name}` : row.guest_id || '-'; };

  const columns = [
    { key: 'gate_name', label: 'Gate' },
    { key: 'guest_id', label: 'Guest', render: (v, row) => getGuestName(row) },
    { key: 'action', label: 'Action', render: (v) => <span className={`status-badge ${v}`}>{v || '-'}</span> },
    { key: 'access_code', label: 'Access Code' },
    { key: 'created_at', label: 'Timestamp', render: (v) => v ? new Date(v).toLocaleString() : '-' },
  ];

  const detailFields = [
    { key: 'gate_name', label: 'Gate' }, { key: 'guest_id', label: 'Guest ID' },
    { key: 'action', label: 'Action', type: 'badge' }, { key: 'access_code', label: 'Access Code' },
    { key: 'vehicle_info', label: 'Vehicle Info' }, { key: 'created_at', label: 'Timestamp', type: 'date' },
    { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'gate_name', label: 'Gate', type: 'select', required: true, options: [
      { value: 'Main Gate', label: 'Main Gate' }, { value: 'Back Gate', label: 'Back Gate' },
      { value: 'Pool Gate', label: 'Pool Gate' }, { value: 'Service Gate', label: 'Service Gate' },
    ]},
    { key: 'guest_id', label: 'Guest', type: 'select', options: guests.map(g => ({ value: g.id || g._id, label: `${g.first_name} ${g.last_name}` })) },
    { key: 'access_code', label: 'Access Code', type: 'text' },
    { key: 'action', label: 'Action', type: 'select', required: true, options: [
      { value: 'entry', label: 'Entry' }, { value: 'exit', label: 'Exit' }, { value: 'denied', label: 'Denied' },
    ]},
    { key: 'vehicle_info', label: 'Vehicle Info', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/security/${editData.id || editData._id}`, formData); }
      else { await api.post('/security', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/security/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Security Access Log" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Log Access" searchFields={['gate_name', 'action', 'access_code']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title="Access Log Details" data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Log' : 'Log Access Event'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default Security;
