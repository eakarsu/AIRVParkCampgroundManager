import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function Propane() {
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
      const [d, g] = await Promise.all([api.get('/propane'), api.get('/guests')]);
      setData(Array.isArray(d) ? d : (d.data || []));
      setGuests(Array.isArray(g) ? g : (g.data || []));
    } catch (e) { setError('Failed to load data'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getGuestName = (row) => { const g = guests.find(g => (g.id || g._id) == row.guest_id); return g ? `${g.first_name} ${g.last_name}` : row.guest_id || '-'; };

  const columns = [
    { key: 'guest_id', label: 'Guest', render: (v, row) => getGuestName(row) },
    { key: 'gallons', label: 'Gallons' },
    { key: 'price_per_gallon', label: 'Price/Gal', render: (v) => v ? `$${Number(v).toFixed(2)}` : '-' },
    { key: 'total', label: 'Total', render: (v, row) => { const t = v || (row.gallons * row.price_per_gallon); return t ? `$${Number(t).toFixed(2)}` : '-'; } },
    { key: 'tank_size', label: 'Tank Size' },
    { key: 'created_at', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  const detailFields = [
    { key: 'guest_id', label: 'Guest ID' }, { key: 'gallons', label: 'Gallons', type: 'number' },
    { key: 'price_per_gallon', label: 'Price Per Gallon', type: 'currency' },
    { key: 'total', label: 'Total', type: 'currency' }, { key: 'tank_size', label: 'Tank Size' },
    { key: 'created_at', label: 'Date', type: 'date' }, { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'guest_id', label: 'Guest', type: 'select', required: true, options: guests.map(g => ({ value: g.id || g._id, label: `${g.first_name} ${g.last_name}` })) },
    { key: 'gallons', label: 'Gallons', type: 'number', required: true },
    { key: 'price_per_gallon', label: 'Price Per Gallon ($)', type: 'number', required: true },
    { key: 'tank_size', label: 'Tank Size', type: 'select', options: [
      { value: '20lb', label: '20 lb' }, { value: '30lb', label: '30 lb' },
      { value: '40lb', label: '40 lb' }, { value: '100lb', label: '100 lb' },
    ]},
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      const submitData = { ...formData, total: (formData.gallons || 0) * (formData.price_per_gallon || 0) };
      if (editData) { await api.put(`/propane/${editData.id || editData._id}`, submitData); }
      else { await api.post('/propane', submitData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/propane/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Propane Sales" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="New Sale" searchFields={['tank_size']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title="Propane Sale Details" data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Sale' : 'New Propane Sale'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default Propane;
