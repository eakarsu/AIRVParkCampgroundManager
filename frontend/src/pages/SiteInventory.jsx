import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import { api } from '../api';

function SiteInventory() {
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
      const res = await api.get('/sites');
      setData(Array.isArray(res) ? res : (res.data || []));
    } catch (e) { setError('Failed to load sites'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    { key: 'site_number', label: 'Site #' },
    { key: 'type', label: 'Type', render: (v) => <span className={`status-badge ${v}`}>{v ? v.replace(/_/g, ' ') : '-'}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`status-badge ${v}`}>{v ? v.replace(/_/g, ' ') : '-'}</span> },
    { key: 'max_rig_length', label: 'Max Rig Length', render: (v) => v ? `${v} ft` : '-' },
    { key: 'amp_service', label: 'Amp Service', render: (v) => v ? `${v}A` : '-' },
    { key: 'daily_rate', label: 'Daily Rate', render: (v) => v ? `$${Number(v).toFixed(2)}` : '-' },
  ];

  const detailFields = [
    { key: 'site_number', label: 'Site Number' },
    { key: 'type', label: 'Type', type: 'badge' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'length_ft', label: 'Length (ft)' },
    { key: 'width_ft', label: 'Width (ft)' },
    { key: 'max_rig_length', label: 'Max Rig Length' },
    { key: 'has_slides_room', label: 'Slide Room', type: 'boolean' },
    { key: 'amp_service', label: 'Amp Service' },
    { key: 'has_water', label: 'Water Hookup', type: 'boolean' },
    { key: 'has_sewer', label: 'Sewer Hookup', type: 'boolean' },
    { key: 'wifi_tier', label: 'WiFi Tier' },
    { key: 'daily_rate', label: 'Daily Rate', type: 'currency' },
    { key: 'weekly_rate', label: 'Weekly Rate', type: 'currency' },
    { key: 'monthly_rate', label: 'Monthly Rate', type: 'currency' },
    { key: 'seasonal_rate', label: 'Seasonal Rate', type: 'currency' },
    { key: 'notes', label: 'Notes', fullWidth: true },
  ];

  const formFields = [
    { key: 'site_number', label: 'Site Number', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'select', required: true, options: [
      { value: 'full_hookup', label: 'Full Hookup' },
      { value: 'water_electric', label: 'Water & Electric' },
      { value: 'tent', label: 'Tent' },
      { value: 'cabin', label: 'Cabin' },
    ]},
    { key: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'available', label: 'Available' },
      { value: 'occupied', label: 'Occupied' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'reserved', label: 'Reserved' },
    ]},
    { key: 'length_ft', label: 'Length (ft)', type: 'number' },
    { key: 'width_ft', label: 'Width (ft)', type: 'number' },
    { key: 'max_rig_length', label: 'Max Rig Length (ft)', type: 'number' },
    { key: 'has_slides_room', label: 'Has Slide Room', type: 'checkbox' },
    { key: 'amp_service', label: 'Amp Service', type: 'select', options: [
      { value: '30', label: '30 Amp' },
      { value: '50', label: '50 Amp' },
    ]},
    { key: 'has_water', label: 'Water Hookup', type: 'checkbox' },
    { key: 'has_sewer', label: 'Sewer Hookup', type: 'checkbox' },
    { key: 'wifi_tier', label: 'WiFi Tier', type: 'select', options: [
      { value: 'basic', label: 'Basic' },
      { value: 'premium', label: 'Premium' },
      { value: 'none', label: 'None' },
    ]},
    { key: 'daily_rate', label: 'Daily Rate ($)', type: 'number' },
    { key: 'weekly_rate', label: 'Weekly Rate ($)', type: 'number' },
    { key: 'monthly_rate', label: 'Monthly Rate ($)', type: 'number' },
    { key: 'seasonal_rate', label: 'Seasonal Rate ($)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editData) {
        await api.put(`/sites/${editData.id || editData._id}`, formData);
      } else {
        await api.post('/sites', formData);
      }
      setShowForm(false);
      setEditData(null);
      fetchData();
    } catch (e) { setError('Failed to save site'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete this site?')) return;
    try {
      await api.delete(`/sites/${item.id || item._id}`);
      setShowDetail(false);
      setSelected(null);
      fetchData();
    } catch (e) { setError('Failed to delete site'); }
  };

  const handleEdit = (item) => {
    setEditData(item);
    setShowDetail(false);
    setShowForm(true);
  };

  if (loading) return <><Navbar /><div className="page-container"><div className="loading-container"><div className="loading-spinner"></div> Loading...</div></div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        <DataTable
          title="Site Inventory"
          columns={columns}
          data={data}
          onRowClick={(row) => { setSelected(row); setShowDetail(true); }}
          onAdd={() => { setEditData(null); setShowForm(true); }}
          addLabel="Add Site"
          searchFields={['site_number', 'type', 'status']}
        />
        <DetailModal
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          title={`Site ${selected?.site_number || ''}`}
          data={selected}
          fields={detailFields}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <FormModal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditData(null); }}
          title={editData ? 'Edit Site' : 'Add New Site'}
          fields={formFields}
          initialData={editData}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}

export default SiteInventory;
