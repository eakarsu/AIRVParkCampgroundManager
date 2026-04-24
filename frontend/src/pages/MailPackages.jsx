import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function MailPackages() {
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
      const [d, g] = await Promise.all([api.get('/mail-packages'), api.get('/guests')]);
      setData(Array.isArray(d) ? d : (d.data || []));
      setGuests(Array.isArray(g) ? g : (g.data || []));
    } catch (e) { setError('Failed to load data'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getGuestName = (row) => { const g = guests.find(g => (g.id || g._id) == row.guest_id); return g ? `${g.first_name} ${g.last_name}` : row.guest_id || '-'; };

  const columns = [
    { key: 'guest_id', label: 'Guest', render: (v, row) => getGuestName(row) },
    { key: 'type', label: 'Type', render: (v) => v ? v.replace(/_/g, ' ') : '-' },
    { key: 'sender', label: 'Sender' },
    { key: 'tracking_number', label: 'Tracking #' },
    { key: 'status', label: 'Status', render: (v) => <span className={`status-badge ${v}`}>{v ? v.replace(/_/g, ' ') : '-'}</span> },
    { key: 'created_at', label: 'Received', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  const detailFields = [
    { key: 'guest_id', label: 'Guest ID' }, { key: 'type', label: 'Type' },
    { key: 'sender', label: 'Sender' }, { key: 'tracking_number', label: 'Tracking Number' },
    { key: 'status', label: 'Status', type: 'badge' }, { key: 'created_at', label: 'Received Date', type: 'date' },
    { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'guest_id', label: 'Guest', type: 'select', required: true, options: guests.map(g => ({ value: g.id || g._id, label: `${g.first_name} ${g.last_name}` })) },
    { key: 'type', label: 'Type', type: 'select', required: true, options: [
      { value: 'mail', label: 'Mail' }, { value: 'package', label: 'Package' }, { value: 'certified', label: 'Certified' },
    ]},
    { key: 'sender', label: 'Sender', type: 'text' },
    { key: 'tracking_number', label: 'Tracking Number', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'received', label: 'Received' }, { value: 'notified', label: 'Notified' },
      { value: 'picked_up', label: 'Picked Up' }, { value: 'returned', label: 'Returned' },
    ]},
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/mail-packages/${editData.id || editData._id}`, formData); }
      else { await api.post('/mail-packages', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/mail-packages/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Mail & Packages" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Log Mail/Package" searchFields={['sender', 'tracking_number', 'status', 'type']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title="Mail/Package Details" data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Record' : 'Log Mail/Package'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default MailPackages;
