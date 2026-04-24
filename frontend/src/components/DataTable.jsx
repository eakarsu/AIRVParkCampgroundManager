import React, { useState } from 'react';

function DataTable({ columns, data, onRowClick, title, onAdd, addLabel, searchFields }) {
  const [search, setSearch] = useState('');

  const filteredData = search && searchFields
    ? data.filter(row =>
        searchFields.some(field => {
          const val = row[field];
          return val && String(val).toLowerCase().includes(search.toLowerCase());
        })
      )
    : data;

  const renderCell = (row, col) => {
    if (col.render) return col.render(row[col.key], row);
    const val = row[col.key];
    if (val === null || val === undefined) return '-';
    return String(val);
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <div>
          <h2>{title}</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
          </span>
        </div>
        {onAdd && (
          <button className="btn btn-primary" onClick={onAdd}>+ {addLabel || 'Add New'}</button>
        )}
      </div>
      {searchFields && (
        <div className="search-bar" style={{ padding: '0 24px 16px' }}>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}
      <div className="table-responsive">
        {filteredData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Records Found</h3>
            <p>{search ? 'Try a different search term' : 'Click "Add New" to create your first record'}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={row.id || row._id || idx} onClick={() => onRowClick && onRowClick(row)}>
                  {columns.map((col) => (
                    <td key={col.key}>{renderCell(row, col)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default DataTable;
