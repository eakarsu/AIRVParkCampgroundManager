import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function AmenityBookings() {
  const [data, setData] = useState([]);
  const [amenities, setAmenities] = useState([]);
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
      const [d, a, g] = await Promise.all([api.get('/amenity-bookings'), api.get('/amenities'), api.get('/guests')]);
      setData(Array.isArray(d) ? d : (d.data || []));
      setAmenities(Array.isArray(a) ? a : (a.data || []));
      setGuests(Array.isArray(g) ? g : (g.data || []));
    } catch (e) { setError('Failed to load data'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getAmenityName = (row) => { const a = amenities.find(a => (a.id || a._id) == row.amenity_id); return a ? a.name : row.amenity_id || '-'; };
  const getGuestName = (row) => { const g = guests.find(g => (g.id || g._id) == row.guest_id); return g ? `${g.first_name} ${g.last_name}` : row.guest_id || '-'; };

  const columns = [
    { key: 'amenity_id', label: 'Amenity', render: (v, row) => getAmenityName(row) },
    { key: 'guest_id', label: 'Guest', render: (v, row) => getGuestName(row) },
    { key: 'booking_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'start_time', label: 'Start Time' },
    { key: 'end_time', label: 'End Time' },
    { key: 'status', label: 'Status', render: (v) => <span className={`status-badge ${v}`}>{v ? v.replace(/_/g, ' ') : '-'}</span> },
  ];

  const detailFields = [
    { key: 'amenity_id', label: 'Amenity ID' }, { key: 'guest_id', label: 'Guest ID' },
    { key: 'booking_date', label: 'Booking Date', type: 'date' },
    { key: 'start_time', label: 'Start Time' }, { key: 'end_time', label: 'End Time' },
    { key: 'status', label: 'Status', type: 'badge' }, { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'amenity_id', label: 'Amenity', type: 'select', required: true, options: amenities.map(a => ({ value: a.id || a._id, label: a.name })) },
    { key: 'guest_id', label: 'Guest', type: 'select', required: true, options: guests.map(g => ({ value: g.id || g._id, label: `${g.first_name} ${g.last_name}` })) },
    { key: 'booking_date', label: 'Booking Date', type: 'date', required: true },
    { key: 'start_time', label: 'Start Time', type: 'time', required: true },
    { key: 'end_time', label: 'End Time', type: 'time', required: true },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'confirmed', label: 'Confirmed' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'completed', label: 'Completed' },
    ]},
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/amenity-bookings/${editData.id || editData._id}`, formData); }
      else { await api.post('/amenity-bookings', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this booking?')) return;
    try { await api.delete(`/amenity-bookings/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Amenity Bookings" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="New Booking" searchFields={['status', 'booking_date']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title="Booking Details" data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Booking' : 'New Amenity Booking'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default AmenityBookings;
