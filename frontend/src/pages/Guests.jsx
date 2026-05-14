import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function Guests() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/guests');
      setData(Array.isArray(res) ? res : (res.data || []));
    } catch (e) { setError('Failed to load guests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    { key: 'first_name', label: 'Name', render: (v, row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || '-' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'rig_type', label: 'Rig Type' },
    { key: 'rig_length', label: 'Rig Length', render: (v) => v ? `${v} ft` : '-' },
    { key: 'loyalty_points', label: 'Loyalty Points', render: (v) => {
      const pts = Number(v) || 0;
      const tier = pts >= 500 ? 'Gold' : pts >= 200 ? 'Silver' : 'Bronze';
      const colors = { Gold: '#d97706', Silver: '#64748b', Bronze: '#92400e' };
      return (
        <span>
          <span style={{ fontWeight: 700 }}>{pts.toLocaleString()}</span>
          <span style={{ marginLeft: '6px', fontSize: '10px', background: colors[tier] + '20', color: colors[tier], padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
            {tier}
          </span>
        </span>
      );
    }},
  ];

  const detailFields = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'rig_type', label: 'Rig Type' },
    { key: 'rig_length', label: 'Rig Length' },
    { key: 'rig_slides', label: 'Rig Slides' },
    { key: 'license_plate', label: 'License Plate' },
    { key: 'loyalty_points', label: 'Loyalty Points', type: 'number' },
    { key: 'pet_info', label: 'Pet Info', fullWidth: true },
    { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'first_name', label: 'First Name', type: 'text', required: true },
    { key: 'last_name', label: 'Last Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'rig_type', label: 'Rig Type', type: 'select', options: [
      { value: 'Class A', label: 'Class A' },
      { value: 'Class B', label: 'Class B' },
      { value: 'Class C', label: 'Class C' },
      { value: 'Fifth Wheel', label: 'Fifth Wheel' },
      { value: 'Travel Trailer', label: 'Travel Trailer' },
      { value: 'Pop-up', label: 'Pop-up' },
      { value: 'Tent', label: 'Tent' },
      { value: 'None', label: 'None' },
    ]},
    { key: 'rig_length', label: 'Rig Length (ft)', type: 'number' },
    { key: 'rig_slides', label: 'Number of Slides', type: 'number' },
    { key: 'license_plate', label: 'License Plate', type: 'text' },
    { key: 'pet_info', label: 'Pet Information', type: 'textarea' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) { await api.put(`/guests/${editData.id || editData._id}`, formData); }
      else { await api.post('/guests', formData); }
      setShowForm(false); setEditData(null); fetchData();
    } catch (e) { setError('Failed to save guest'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this guest?')) return;
    try { await api.delete(`/guests/${item.id || item._id}`); setShowDetail(false); setSelected(null); fetchData(); }
    catch (e) { setError('Failed to delete'); }
  };

  const handleEdit = (item) => { setEditData(item); setShowDetail(false); setShowForm(true); };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable title="Guest Profiles" columns={columns} data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Add Guest" searchFields={['first_name', 'last_name', 'email', 'phone']} />
        <DetailModal isOpen={showDetail} onClose={() => setShowDetail(false)}
          title={`${selected?.first_name || ''} ${selected?.last_name || ''}`}
          data={selected} fields={detailFields}
          onEdit={handleEdit} onDelete={handleDelete} />
        <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Guest' : 'New Guest'}
          fields={formFields} initialData={editData} onSubmit={handleSubmit} />
      </div>
    </>
  );
}

export default Guests;
