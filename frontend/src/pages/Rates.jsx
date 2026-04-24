import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function Rates() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    try { setLoading(true); const res = await api.get('/rates'); setData(Array.isArray(res) ? res : (res.data || [])); }
    catch (e) { setError('Failed to load rates'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'rate_type', label: 'Type', render: (v) => <span className={`status-badge ${v}`}>{v ? v.replace(/_/g, ' ') : '-'}</span> },
    { key: 'site_type', label: 'Site Type', render: (v) => v ? v.replace(/_/g, ' ') : '-' },
    { key: 'amount', label: 'Amount', render: (v) => v ? `$${Number(v).toFixed(2)}` : '-' },
    { key: 'is_active', label: 'Active', render: (v) => <span className={`status-badge ${v ? 'green' : 'gray'}`}>{v ? 'Yes' : 'No'}</span> },
    { key: 'start_date', label: 'Date Range', render: (v, row) => `${v ? new Date(v).toLocaleDateString() : '?'} - ${row.end_date ? new Date(row.end_date).toLocaleDateString() : '?'}` },
  ];

  const detailFields = [
    { key: 'name', label: 'Name' }, { key: 'rate_type', label: 'Rate Type', type: 'badge' },
    { key: 'site_type', label: 'Site Type' }, { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'start_date', label: 'Start Date', type: 'date' }, { key: 'end_date', label: 'End Date', type: 'date' },
    { key: 'is_active', label: 'Active', type: 'boolean' }, { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'name', label: 'Rate Name', type: 'text', required: true },
    { key: 'rate_type', label: 'Rate Type', type: 'select', required: true, options: [
      { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' }, { value: 'seasonal', label: 'Seasonal' }, { value: 'event', label: 'Event' },
    ]},
    { key: 'site_type', label: 'Site Type', type: 'select', options: [
      { value: 'full_hookup', label: 'Full Hookup' }, { value: 'water_electric', label: 'Water & Electric' },
      { value: 'tent', label: 'Tent' }, { value: 'cabin', label: 'Cabin' },
    ]},
    { key: 'amount', label: 'Amount ($)', type: 'number', required: true },
    { key: 'start_date', label: 'Start Date', type: 'date' },
    { key: 'end_date', label: 'End Date', type: 'date' },
    { key: 'is_active', label: 'Active', type: 'checkbox' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/rates/${editData.id || editData._id}`, formData); }
      else { await api.post('/rates', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this rate?')) return;
    try { await api.delete(`/rates/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Rate Management" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Add Rate" searchFields={['name', 'rate_type', 'site_type']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title={selected?.name || 'Rate Details'} data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Rate' : 'New Rate'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default Rates;
