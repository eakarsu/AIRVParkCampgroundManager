import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function Revenue() {
  const [data, setData] = useState([]);
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
      const [d, s] = await Promise.all([api.get('/revenue'), api.get('/sites')]);
      setData(Array.isArray(d) ? d : (d.data || []));
      setSites(Array.isArray(s) ? s : (s.data || []));
    } catch (e) { setError('Failed to load data'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getSiteNumber = (row) => { const s = sites.find(s => (s.id || s._id) == row.site_id); return s ? s.site_number : row.site_id || '-'; };

  const totalRevenue = data.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const now = new Date();
  const thisMonth = data.filter(r => {
    const d = new Date(r.revenue_date || r.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const avgPerDay = data.length > 0 ? totalRevenue / Math.max(1, new Set(data.map(r => (r.revenue_date || '').slice(0, 10))).size) : 0;

  const columns = [
    { key: 'source', label: 'Source' },
    { key: 'site_id', label: 'Site', render: (v, row) => getSiteNumber(row) },
    { key: 'amount', label: 'Amount', render: (v) => v ? `$${Number(v).toFixed(2)}` : '-' },
    { key: 'revenue_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'category', label: 'Category', render: (v) => v ? v.replace(/_/g, ' ') : '-' },
  ];

  const detailFields = [
    { key: 'source', label: 'Source' }, { key: 'site_id', label: 'Site ID' },
    { key: 'amount', label: 'Amount', type: 'currency' }, { key: 'revenue_date', label: 'Date', type: 'date' },
    { key: 'category', label: 'Category' }, { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'source', label: 'Source', type: 'text', required: true },
    { key: 'site_id', label: 'Site', type: 'select', options: sites.map(s => ({ value: s.id || s._id, label: `Site ${s.site_number}` })) },
    { key: 'amount', label: 'Amount ($)', type: 'number', required: true },
    { key: 'revenue_date', label: 'Date', type: 'date', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: [
      { value: 'reservation', label: 'Reservation' }, { value: 'utility', label: 'Utility' },
      { value: 'store', label: 'Store' }, { value: 'amenity', label: 'Amenity' },
      { value: 'propane', label: 'Propane' }, { value: 'firewood', label: 'Firewood' }, { value: 'other', label: 'Other' },
    ]},
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/revenue/${editData.id || editData._id}`, formData); }
      else { await api.post('/revenue', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/revenue/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">This Month</div>
            <div className="stat-value">${thisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Average Per Day</div>
            <div className="stat-value">${avgPerDay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        <DataTable title="Revenue Records" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Add Revenue" searchFields={['source', 'category']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title="Revenue Details" data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Revenue' : 'New Revenue Entry'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default Revenue;
