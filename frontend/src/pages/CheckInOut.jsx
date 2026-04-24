import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function CheckInOut() {
  const [data, setData] = useState([]);
  const [reservations, setReservations] = useState([]);
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
      const [d, r, g, s] = await Promise.all([
        api.get('/checkinout'), api.get('/reservations'), api.get('/guests'), api.get('/sites')
      ]);
      setData(Array.isArray(d) ? d : (d.data || []));
      setReservations(Array.isArray(r) ? r : (r.data || []));
      setGuests(Array.isArray(g) ? g : (g.data || []));
      setSites(Array.isArray(s) ? s : (s.data || []));
    } catch (e) { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getGuestName = (row) => {
    const g = guests.find(g => (g.id || g._id) == row.guest_id);
    return g ? `${g.first_name} ${g.last_name}` : row.guest_id || '-';
  };

  const getSiteNumber = (row) => {
    const s = sites.find(s => (s.id || s._id) == row.site_id);
    return s ? s.site_number : row.site_id || '-';
  };

  const columns = [
    { key: 'guest_id', label: 'Guest', render: (v, row) => getGuestName(row) },
    { key: 'site_id', label: 'Site', render: (v, row) => getSiteNumber(row) },
    { key: 'type', label: 'Type', render: (v) => <span className={`status-badge ${v}`}>{v ? v.replace(/_/g, ' ') : '-'}</span> },
    { key: 'timestamp', label: 'Timestamp', render: (v) => v ? new Date(v).toLocaleString() : '-' },
    { key: 'processed_by', label: 'Processed By' },
  ];

  const detailFields = [
    { key: 'reservation_id', label: 'Reservation ID' },
    { key: 'guest_id', label: 'Guest ID' },
    { key: 'site_id', label: 'Site ID' },
    { key: 'type', label: 'Type', type: 'badge' },
    { key: 'timestamp', label: 'Timestamp', type: 'date' },
    { key: 'processed_by', label: 'Processed By' },
    { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'reservation_id', label: 'Reservation', type: 'select', options: reservations.map(r => ({ value: r.id || r._id, label: `Reservation #${r.id || r._id}` })) },
    { key: 'guest_id', label: 'Guest', type: 'select', required: true, options: guests.map(g => ({ value: g.id || g._id, label: `${g.first_name} ${g.last_name}` })) },
    { key: 'site_id', label: 'Site', type: 'select', required: true, options: sites.map(s => ({ value: s.id || s._id, label: `Site ${s.site_number}` })) },
    { key: 'type', label: 'Type', type: 'select', required: true, options: [
      { value: 'check_in', label: 'Check In' },
      { value: 'check_out', label: 'Check Out' },
    ]},
    { key: 'processed_by', label: 'Processed By', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/checkinout/${editData.id || editData._id}`, formData); }
      else { await api.post('/checkinout', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/checkinout/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Check-In / Check-Out" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="New Check-In/Out" searchFields={['type', 'processed_by']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title="Check-In/Out Details" data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Record' : 'New Check-In/Out'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default CheckInOut;
