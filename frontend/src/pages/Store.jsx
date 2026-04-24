import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function Store() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    try { setLoading(true); const res = await api.get('/store'); setData(Array.isArray(res) ? res : (res.data || [])); }
    catch (e) { setError('Failed to load store items'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category', render: (v) => v ? v.replace(/_/g, ' ') : '-' },
    { key: 'price', label: 'Price', render: (v) => v ? `$${Number(v).toFixed(2)}` : '-' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'sku', label: 'SKU' },
  ];

  const detailFields = [
    { key: 'name', label: 'Name' }, { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price', type: 'currency' }, { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'sku', label: 'SKU' }, { key: 'description', label: 'Description', fullWidth: true },
  ];

  const formFields = [
    { key: 'name', label: 'Product Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: [
      { value: 'snacks', label: 'Snacks' }, { value: 'beverages', label: 'Beverages' },
      { value: 'camping', label: 'Camping' }, { value: 'fishing', label: 'Fishing' },
      { value: 'souvenirs', label: 'Souvenirs' }, { value: 'hygiene', label: 'Hygiene' }, { value: 'other', label: 'Other' },
    ]},
    { key: 'price', label: 'Price ($)', type: 'number', required: true },
    { key: 'quantity', label: 'Quantity', type: 'number', required: true },
    { key: 'sku', label: 'SKU', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/store/${editData.id || editData._id}`, formData); }
      else { await api.post('/store', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this item?')) return;
    try { await api.delete(`/store/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Camp Store Inventory" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Add Product" searchFields={['name', 'category', 'sku']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title={selected?.name || 'Product'} data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Product' : 'New Product'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default Store;
