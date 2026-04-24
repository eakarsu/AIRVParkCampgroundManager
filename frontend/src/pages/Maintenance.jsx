import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function Maintenance() {
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
      const [d, s] = await Promise.all([api.get('/maintenance'), api.get('/sites')]);
      setData(Array.isArray(d) ? d : (d.data || []));
      setSites(Array.isArray(s) ? s : (s.data || []));
    } catch (e) { setError('Failed to load data'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getSiteNumber = (row) => { const s = sites.find(s => (s.id || s._id) == row.site_id); return s ? s.site_number : row.site_id || '-'; };

  const columns = [
    { key: 'site_id', label: 'Site', render: (v, row) => getSiteNumber(row) },
    { key: 'title', label: 'Title' },
    { key: 'priority', label: 'Priority', render: (v) => <span className={`status-badge ${v}`}>{v || '-'}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`status-badge ${v}`}>{v ? v.replace(/_/g, ' ') : '-'}</span> },
    { key: 'assigned_to', label: 'Assigned To' },
    { key: 'due_date', label: 'Due Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  const detailFields = [
    { key: 'site_id', label: 'Site ID' }, { key: 'title', label: 'Title' },
    { key: 'priority', label: 'Priority', type: 'badge' }, { key: 'status', label: 'Status', type: 'badge' },
    { key: 'assigned_to', label: 'Assigned To' }, { key: 'due_date', label: 'Due Date', type: 'date' },
    { key: 'cost', label: 'Cost', type: 'currency' },
    { key: 'description', label: 'Description', fullWidth: true }, { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'site_id', label: 'Site', type: 'select', options: sites.map(s => ({ value: s.id || s._id, label: `Site ${s.site_number}` })) },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'priority', label: 'Priority', type: 'select', required: true, options: [
      { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
    ]},
    { key: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
    ]},
    { key: 'assigned_to', label: 'Assigned To', type: 'text' },
    { key: 'due_date', label: 'Due Date', type: 'date' },
    { key: 'cost', label: 'Cost ($)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/maintenance/${editData.id || editData._id}`, formData); }
      else { await api.post('/maintenance', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this work order?')) return;
    try { await api.delete(`/maintenance/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Maintenance Work Orders" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="New Work Order" searchFields={['title', 'priority', 'status', 'assigned_to']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title={selected?.title || 'Work Order'} data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Work Order' : 'New Work Order'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default Maintenance;
