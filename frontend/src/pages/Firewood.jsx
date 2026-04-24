import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function Firewood() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    try { setLoading(true); const res = await api.get('/firewood'); setData(Array.isArray(res) ? res : (res.data || [])); }
    catch (e) { setError('Failed to load data'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    { key: 'wood_type', label: 'Wood Type', render: (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : '-' },
    { key: 'quantity_bundles', label: 'Quantity (bundles)' },
    { key: 'price_per_bundle', label: 'Price/Bundle', render: (v) => v ? `$${Number(v).toFixed(2)}` : '-' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'last_restocked', label: 'Last Restocked', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  const detailFields = [
    { key: 'wood_type', label: 'Wood Type' }, { key: 'quantity_bundles', label: 'Quantity (bundles)', type: 'number' },
    { key: 'price_per_bundle', label: 'Price Per Bundle', type: 'currency' }, { key: 'supplier', label: 'Supplier' },
    { key: 'last_restocked', label: 'Last Restocked', type: 'date' }, { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'wood_type', label: 'Wood Type', type: 'select', required: true, options: [
      { value: 'oak', label: 'Oak' }, { value: 'pine', label: 'Pine' },
      { value: 'hickory', label: 'Hickory' }, { value: 'mesquite', label: 'Mesquite' }, { value: 'mixed', label: 'Mixed' },
    ]},
    { key: 'quantity_bundles', label: 'Quantity (bundles)', type: 'number', required: true },
    { key: 'price_per_bundle', label: 'Price Per Bundle ($)', type: 'number', required: true },
    { key: 'supplier', label: 'Supplier', type: 'text' },
    { key: 'last_restocked', label: 'Last Restocked', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/firewood/${editData.id || editData._id}`, formData); }
      else { await api.post('/firewood', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/firewood/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Firewood Inventory" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Add Firewood" searchFields={['wood_type', 'supplier']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title="Firewood Details" data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Record' : 'Add Firewood'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default Firewood;
