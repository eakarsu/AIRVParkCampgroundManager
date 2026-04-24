import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function Utilities() {
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
      const [d, s] = await Promise.all([api.get('/utilities'), api.get('/sites')]);
      setData(Array.isArray(d) ? d : (d.data || []));
      setSites(Array.isArray(s) ? s : (s.data || []));
    } catch (e) { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getSiteNumber = (row) => {
    const s = sites.find(s => (s.id || s._id) == row.site_id);
    return s ? s.site_number : row.site_id || '-';
  };

  const columns = [
    { key: 'site_id', label: 'Site', render: (v, row) => getSiteNumber(row) },
    { key: 'reading_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'electric_kwh', label: 'Electric (kWh)' },
    { key: 'water_gallons', label: 'Water (gal)' },
    { key: 'sewer_gallons', label: 'Sewer (gal)' },
    { key: 'amount_due', label: 'Amount Due', render: (v) => v ? `$${Number(v).toFixed(2)}` : '-' },
  ];

  const detailFields = [
    { key: 'site_id', label: 'Site ID' },
    { key: 'reading_date', label: 'Reading Date', type: 'date' },
    { key: 'electric_kwh', label: 'Electric (kWh)', type: 'number' },
    { key: 'water_gallons', label: 'Water (gal)', type: 'number' },
    { key: 'sewer_gallons', label: 'Sewer (gal)', type: 'number' },
    { key: 'amount_due', label: 'Amount Due', type: 'currency' },
    { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'site_id', label: 'Site', type: 'select', required: true, options: sites.map(s => ({ value: s.id || s._id, label: `Site ${s.site_number}` })) },
    { key: 'reading_date', label: 'Reading Date', type: 'date', required: true },
    { key: 'electric_kwh', label: 'Electric (kWh)', type: 'number' },
    { key: 'water_gallons', label: 'Water (gallons)', type: 'number' },
    { key: 'sewer_gallons', label: 'Sewer (gallons)', type: 'number' },
    { key: 'amount_due', label: 'Amount Due ($)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/utilities/${editData.id || editData._id}`, formData); }
      else { await api.post('/utilities', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this reading?')) return;
    try { await api.delete(`/utilities/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Utility Metering" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Add Reading" searchFields={['site_id', 'reading_date']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title="Utility Reading" data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Reading' : 'New Utility Reading'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default Utilities;
