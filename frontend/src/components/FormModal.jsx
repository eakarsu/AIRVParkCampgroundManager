import React, { useState, useEffect } from 'react';

function FormModal({ isOpen, onClose, title, fields, initialData, onSubmit }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      const initial = {};
      fields.forEach(f => {
        if (initialData && initialData[f.key] !== undefined) {
          initial[f.key] = initialData[f.key];
        } else if (f.type === 'checkbox') {
          initial[f.key] = false;
        } else {
          initial[f.key] = '';
        }
      });
      setFormData(initial);
      setErrors({});
    }
  }, [isOpen, initialData, fields]);

  if (!isOpen) return null;

  const handleChange = (key, value, type) => {
    let val = value;
    if (type === 'checkbox') val = value;
    else if (type === 'number') val = value === '' ? '' : Number(value);
    setFormData(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    fields.forEach(f => {
      if (f.required && (formData[f.key] === '' || formData[f.key] === undefined || formData[f.key] === null)) {
        newErrors[f.key] = `${f.label} is required`;
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {fields.map((field) => (
              <div className="form-group" key={field.key}>
                {field.type === 'checkbox' ? (
                  <div className="form-checkbox-group">
                    <input
                      type="checkbox"
                      id={field.key}
                      checked={!!formData[field.key]}
                      onChange={(e) => handleChange(field.key, e.target.checked, 'checkbox')}
                    />
                    <label htmlFor={field.key}>
                      {field.label}
                    </label>
                  </div>
                ) : (
                  <>
                    <label>
                      {field.label}
                      {field.required && <span className="required">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        className="form-select"
                        value={formData[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      >
                        <option value="">Select {field.label}</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className="form-textarea"
                        value={formData[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder || ''}
                      />
                    ) : (
                      <input
                        className="form-input"
                        type={field.type || 'text'}
                        value={formData[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value, field.type)}
                        placeholder={field.placeholder || ''}
                        step={field.type === 'number' ? 'any' : undefined}
                      />
                    )}
                  </>
                )}
                {errors[field.key] && <div className="form-error">{errors[field.key]}</div>}
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormModal;
