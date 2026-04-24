import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function DumpStation() {
  const [data, setData] = useState([]);
  const [sites, setSites] = useState([]);
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
      const [d, s, g] = await Promise.all([api.get('/dump-station'), api.get('/sites'), api.get('/guests')]);
      setData(Array.isArray(d) ? d : (d.data || []));
      setSites(Array.isArray(s) ? s : (s.data || []));
      setGuests(Array.isArray(g) ? g : (g.data || []));
    } catch (e) { setError('Failed to load data'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getSiteNumber = (row) => { const s = sites.find(s => (s.id || s._id) == row.site_id); return s ? s.site_number : row.site_id || '-'; };
  const getGuestName = (row) => { const g = guests.find(g => (g.id || g._id) == row.guest_id); return g ? `${g.first_name} ${g.last_name}` : row.guest_id || '-'; };

  const columns = [
    { key: 'station_number', label: 'Station #' },
    { key: 'site_id', label: 'Site', render: (v, row) => getSiteNumber(row) },
    { key: 'guest_id', label: 'Guest', render: (v, row) => getGuestName(row) },
    { key: 'created_at', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'duration_minutes', label: 'Duration (min)' },
  ];

  const detailFields = [
    { key: 'station_number', label: 'Station Number' }, { key: 'site_id', label: 'Site ID' },
    { key: 'guest_id', label: 'Guest ID' }, { key: 'duration_minutes', label: 'Duration (min)', type: 'number' },
    { key: 'created_at', label: 'Date', type: 'date' }, { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'station_number', label: 'Station', type: 'select', required: true, options: [
      { value: '1', label: 'Station 1' }, { value: '2', label: 'Station 2' }, { value: '3', label: 'Station 3' },
    ]},
    { key: 'site_id', label: 'Site', type: 'select', options: sites.map(s => ({ value: s.id || s._id, label: `Site ${s.site_number}` })) },
    { key: 'guest_id', label: 'Guest', type: 'select', options: guests.map(g => ({ value: g.id || g._id, label: `${g.first_name} ${g.last_name}` })) },
    { key: 'duration_minutes', label: 'Duration (minutes)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/dump-station/${editData.id || editData._id}`, formData); }
      else { await api.post('/dump-station', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/dump-station/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Dump Station Log" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Log Usage" searchFields={['station_number']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title="Dump Station Record" data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Record' : 'Log Dump Station Usage'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default DumpStation;
