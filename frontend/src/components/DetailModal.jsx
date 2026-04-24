import React from 'react';

function DetailModal({ isOpen, onClose, title, data, fields, onEdit, onDelete }) {
  if (!isOpen || !data) return null;

  const formatValue = (value, type) => {
    if (value === null || value === undefined) return '-';
    switch (type) {
      case 'currency':
        return `$${Number(value).toFixed(2)}`;
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-';
      case 'badge':
        return <span className={`status-badge ${String(value).toLowerCase().replace(/\s+/g, '_')}`}>{String(value).replace(/_/g, ' ')}</span>;
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'number':
        return Number(value).toLocaleString();
      default:
        return String(value);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-view">
            {fields.map((field) => (
              <div key={field.key} className={`detail-row ${field.fullWidth ? 'full-width' : ''}`}>
                <span className="detail-label">{field.label}</span>
                <span className="detail-value">{formatValue(data[field.key], field.type)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          {onDelete && (
            <button className="btn btn-danger" onClick={() => onDelete(data)}>Delete</button>
          )}
          {onEdit && (
            <button className="btn btn-primary" onClick={() => onEdit(data)}>Edit</button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default DetailModal;
