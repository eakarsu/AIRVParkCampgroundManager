import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function StoreTransactions() {
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
      const [d, g] = await Promise.all([api.get('/store-transactions'), api.get('/guests')]);
      setData(Array.isArray(d) ? d : (d.data || []));
      setGuests(Array.isArray(g) ? g : (g.data || []));
    } catch (e) { setError('Failed to load data'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getGuestName = (row) => { const g = guests.find(g => (g.id || g._id) == row.guest_id); return g ? `${g.first_name} ${g.last_name}` : row.guest_id || '-'; };

  const columns = [
    { key: 'guest_id', label: 'Guest', render: (v, row) => getGuestName(row) },
    { key: 'items', label: 'Items', render: (v) => { try { const arr = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(arr) ? `${arr.length} item(s)` : v || '-'; } catch { return v || '-'; } } },
    { key: 'total', label: 'Total', render: (v) => v ? `$${Number(v).toFixed(2)}` : '-' },
    { key: 'payment_method', label: 'Payment', render: (v) => v ? v.replace(/_/g, ' ') : '-' },
    { key: 'created_at', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  const detailFields = [
    { key: 'guest_id', label: 'Guest ID' }, { key: 'total', label: 'Total', type: 'currency' },
    { key: 'payment_method', label: 'Payment Method' }, { key: 'created_at', label: 'Date', type: 'date' },
    { key: 'items', label: 'Items', fullWidth: true }, { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'guest_id', label: 'Guest', type: 'select', required: true, options: guests.map(g => ({ value: g.id || g._id, label: `${g.first_name} ${g.last_name}` })) },
    { key: 'items', label: 'Items (JSON)', type: 'textarea', placeholder: '[{"name": "Firewood", "qty": 2, "price": 8.99}]' },
    { key: 'total', label: 'Total ($)', type: 'number', required: true },
    { key: 'payment_method', label: 'Payment Method', type: 'select', required: true, options: [
      { value: 'cash', label: 'Cash' }, { value: 'credit', label: 'Credit Card' }, { value: 'debit', label: 'Debit Card' },
    ]},
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/store-transactions/${editData.id || editData._id}`, formData); }
      else { await api.post('/store-transactions', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this transaction?')) return;
    try { await api.delete(`/store-transactions/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Store Transactions" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="New Transaction" searchFields={['payment_method']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title="Transaction Details" data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Transaction' : 'New Transaction'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default StoreTransactions;
