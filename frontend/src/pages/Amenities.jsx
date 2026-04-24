import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function Amenities() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    try { setLoading(true); const res = await api.get('/amenities'); setData(Array.isArray(res) ? res : (res.data || [])); }
    catch (e) { setError('Failed to load amenities'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (v) => v ? v.replace(/_/g, ' ') : '-' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'status', label: 'Status', render: (v) => <span className={`status-badge ${v}`}>{v ? v.replace(/_/g, ' ') : '-'}</span> },
    { key: 'rate_per_hour', label: 'Rate/Hour', render: (v) => v ? `$${Number(v).toFixed(2)}` : 'Free' },
  ];

  const detailFields = [
    { key: 'name', label: 'Name' }, { key: 'type', label: 'Type' },
    { key: 'capacity', label: 'Capacity', type: 'number' }, { key: 'status', label: 'Status', type: 'badge' },
    { key: 'rate_per_hour', label: 'Rate Per Hour', type: 'currency' },
    { key: 'description', label: 'Description', fullWidth: true },
  ];

  const formFields = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'select', required: true, options: [
      { value: 'pool', label: 'Pool' }, { value: 'rec_hall', label: 'Rec Hall' },
      { value: 'laundry', label: 'Laundry' }, { value: 'playground', label: 'Playground' },
      { value: 'fitness', label: 'Fitness' }, { value: 'other', label: 'Other' },
    ]},
    { key: 'capacity', label: 'Capacity', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }, { value: 'maintenance', label: 'Maintenance' },
    ]},
    { key: 'rate_per_hour', label: 'Rate Per Hour ($)', type: 'number' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/amenities/${editData.id || editData._id}`, formData); }
      else { await api.post('/amenities', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this amenity?')) return;
    try { await api.delete(`/amenities/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Amenities" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Add Amenity" searchFields={['name', 'type', 'status']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title={selected?.name || 'Amenity'} data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Amenity' : 'New Amenity'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default Amenities;
