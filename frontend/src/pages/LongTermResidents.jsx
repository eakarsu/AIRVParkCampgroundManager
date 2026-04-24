import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function LongTermResidents() {
  const [data, setData] = useState([]);
  const [guests, setGuests] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [d, g, s] = await Promise.all([api.get('/long-term'), api.get('/guests'), api.get('/sites')]);
      setData(Array.isArray(d) ? d : (d.data || []));
      setGuests(Array.isArray(g) ? g : (g.data || []));
      setSites(Array.isArray(s) ? s : (s.data || []));
    } catch (e) { setError('Failed to load data'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getGuestName = (row) => { const g = guests.find(g => (g.id || g._id) == row.guest_id); return g ? `${g.first_name} ${g.last_name}` : row.guest_id || '-'; };
  const getSiteNumber = (row) => { const s = sites.find(s => (s.id || s._id) == row.site_id); return s ? s.site_number : row.site_id || '-'; };

  const columns = [
    { key: 'guest_id', label: 'Guest', render: (v, row) => getGuestName(row) },
    { key: 'site_id', label: 'Site', render: (v, row) => getSiteNumber(row) },
    { key: 'lease_start', label: 'Lease Start', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'lease_end', label: 'Lease End', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'monthly_rate', label: 'Monthly Rate', render: (v) => v ? `$${Number(v).toFixed(2)}` : '-' },
    { key: 'status', label: 'Status', render: (v) => <span className={`status-badge ${v}`}>{v ? v.replace(/_/g, ' ') : '-'}</span> },
  ];

  const detailFields = [
    { key: 'guest_id', label: 'Guest ID' }, { key: 'site_id', label: 'Site ID' },
    { key: 'lease_start', label: 'Lease Start', type: 'date' }, { key: 'lease_end', label: 'Lease End', type: 'date' },
    { key: 'monthly_rate', label: 'Monthly Rate', type: 'currency' }, { key: 'status', label: 'Status', type: 'badge' },
    { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'guest_id', label: 'Guest', type: 'select', required: true, options: guests.map(g => ({ value: g.id || g._id, label: `${g.first_name} ${g.last_name}` })) },
    { key: 'site_id', label: 'Site', type: 'select', required: true, options: sites.map(s => ({ value: s.id || s._id, label: `Site ${s.site_number}` })) },
    { key: 'lease_start', label: 'Lease Start', type: 'date', required: true },
    { key: 'lease_end', label: 'Lease End', type: 'date', required: true },
    { key: 'monthly_rate', label: 'Monthly Rate ($)', type: 'number', required: true },
    { key: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'active', label: 'Active' }, { value: 'ending', label: 'Ending' }, { value: 'ended', label: 'Ended' },
    ]},
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/long-term/${editData.id || editData._id}`, formData); }
      else { await api.post('/long-term', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/long-term/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Long-Term Residents" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Add Resident" searchFields={['status']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title="Resident Details" data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Resident' : 'New Long-Term Resident'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default LongTermResidents;
