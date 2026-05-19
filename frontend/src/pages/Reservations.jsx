import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

function Reservations() {
  const [data, setData] = useState([]);
  const [sites, setSites] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, sitesData, guestsData] = await Promise.all([
        api.get('/reservations'),
        api.get('/sites'),
        api.get('/guests'),
      ]);
      setData(Array.isArray(resData) ? resData : (resData.data || []));
      setSites(Array.isArray(sitesData) ? sitesData : (sitesData.data || []));
      setGuests(Array.isArray(guestsData) ? guestsData : (guestsData.data || []));
    } catch (e) { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getGuestName = (row) => {
    if (row.guest_name) return row.guest_name;
    const g = guests.find(g => (g.id || g._id) == row.guest_id);
    return g ? `${g.first_name} ${g.last_name}` : row.guest_id || '-';
  };

  const getSiteNumber = (row) => {
    if (row.site_number) return row.site_number;
    const s = sites.find(s => (s.id || s._id) == row.site_id);
    return s ? s.site_number : row.site_id || '-';
  };

  const columns = [
    { key: 'guest_id', label: 'Guest', render: (v, row) => getGuestName(row) },
    { key: 'site_id', label: 'Site #', render: (v, row) => getSiteNumber(row) },
    { key: 'check_in', label: 'Check-in', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'check_out', label: 'Check-out', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status', render: (v) => <span className={`status-badge ${v}`}>{v ? v.replace(/_/g, ' ') : '-'}</span> },
    { key: 'total_amount', label: 'Total', render: (v) => v ? `$${Number(v).toFixed(2)}` : '-' },
  ];

  const detailFields = [
    { key: 'guest_id', label: 'Guest ID' },
    { key: 'site_id', label: 'Site ID' },
    { key: 'check_in', label: 'Check-in', type: 'date' },
    { key: 'check_out', label: 'Check-out', type: 'date' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'total_amount', label: 'Total Amount', type: 'currency' },
    { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'site_id', label: 'Site', type: 'select', required: true, options: sites.map(s => ({ value: s.id || s._id, label: `Site ${s.site_number} (${s.type})` })) },
    { key: 'guest_id', label: 'Guest', type: 'select', required: true, options: guests.map(g => ({ value: g.id || g._id, label: `${g.first_name} ${g.last_name}` })) },
    { key: 'check_in', label: 'Check-in Date', type: 'date', required: true },
    { key: 'check_out', label: 'Check-out Date', type: 'date', required: true },
    { key: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'checked_in', label: 'Checked In' },
      { value: 'checked_out', label: 'Checked Out' },
      { value: 'cancelled', label: 'Cancelled' },
    ]},
    { key: 'total_amount', label: 'Total Amount ($)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    setConflictWarning(null);
    try {
      if (editData) {
        await api.put(`/reservations/${editData.id || editData._id}`, formData);
      } else {
        const res = await api.post('/reservations', formData);
        if (res && res.error) {
          setError(res.error);
          return;
        }
      }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) {
      // Handle 409 conflict
      if (e.status === 409 || (e.data && e.data.conflict)) {
        setConflictWarning(e.data?.error || 'This site is already booked for the selected dates.');
      } else {
        setError(e.message || 'Failed to save reservation');
      }
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this reservation?')) return;
    try {
      await api.delete(`/reservations/${item.id || item._id}`);
      setShowDetail(false); setSelected(null); fetchData();
    } catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        {conflictWarning && (
          <div style={{ background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontWeight: 500 }}>
            Conflict: {conflictWarning}
          </div>
        )}
        <div style={{ marginBottom: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setShowCalendar(!showCalendar)}>
            {showCalendar ? 'Hide Calendar' : 'Availability Calendar'}
          </button>
        </div>
        {showCalendar && <AvailabilityCalendar />}
        <DataTable title="Reservations" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Add Reservation" searchFields={['guest_name', 'status', 'site_number']}
        />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title="Reservation Details" data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Reservation' : 'New Reservation'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default Reservations;
