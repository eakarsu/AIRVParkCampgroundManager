import React from 'react';

function toTitleCase(str) {
  return str
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function isScoreKey(key) {
  const k = key.toLowerCase();
  return k.includes('score') || k.includes('rating') || k.includes('confidence') || k.includes('probability') || k.includes('percentage');
}

function isCurrencyKey(key) {
  const k = key.toLowerCase();
  return k.includes('cost') || k.includes('price') || k.includes('rate') || k.includes('amount') || k.includes('revenue') || k.includes('fee') || k.includes('budget');
}

function getConfidenceColor(value) {
  const num = Number(value);
  if (num >= 80) return '#388E3C';
  if (num >= 60) return '#F57F17';
  if (num >= 40) return '#FF8F00';
  return '#D32F2F';
}

function RenderValue({ keyName, value, depth = 0 }) {
  if (value === null || value === undefined) return <span style={{ color: '#999' }}>N/A</span>;

  // Boolean
  if (typeof value === 'boolean') {
    return <span style={{ fontSize: '18px' }}>{value ? '✅' : '❌'}</span>;
  }

  // Number
  if (typeof value === 'number') {
    if (isScoreKey(keyName)) {
      const pct = value > 1 ? value : value * 100;
      return (
        <div className="ai-output-confidence">
          <div className="confidence-label">
            <span>{toTitleCase(keyName)}</span>
            <span>{pct.toFixed(1)}%</span>
          </div>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${Math.min(pct, 100)}%`, background: getConfidenceColor(pct) }}
            />
          </div>
        </div>
      );
    }
    if (isCurrencyKey(keyName)) {
      return (
        <div className="ai-output-metric">
          <span className="metric-value">${value.toFixed(2)}</span>
          <span className="metric-label">{toTitleCase(keyName)}</span>
        </div>
      );
    }
    return (
      <div className="ai-output-metric">
        <span className="metric-value">{value.toLocaleString()}</span>
        <span className="metric-label">{toTitleCase(keyName)}</span>
      </div>
    );
  }

  // String
  if (typeof value === 'string') {
    // Check if it looks like a date
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return <span>{new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>;
    }
    // Long text
    if (value.length > 100) {
      return <div className="ai-output-text">{value}</div>;
    }
    return <span>{value}</span>;
  }

  // Array
  if (Array.isArray(value)) {
    if (value.length === 0) return <span style={{ color: '#999' }}>None</span>;

    // Array of objects
    if (typeof value[0] === 'object' && value[0] !== null) {
      return (
        <div>
          {value.map((item, idx) => (
            <div key={idx} className="ai-output-card">
              {typeof item === 'object' ? (
                Object.entries(item).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>
                      {toTitleCase(k)}:
                    </strong>{' '}
                    {typeof v === 'object' ? (
                      <RenderValue keyName={k} value={v} depth={depth + 1} />
                    ) : typeof v === 'number' && isCurrencyKey(k) ? (
                      <span style={{ fontWeight: 600 }}>${Number(v).toFixed(2)}</span>
                    ) : typeof v === 'boolean' ? (
                      <span>{v ? '✅' : '❌'}</span>
                    ) : (
                      <span>{String(v)}</span>
                    )}
                  </div>
                ))
              ) : (
                <span>{String(item)}</span>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Array of strings/numbers
    return (
      <ul className="ai-output-list">
        {value.map((item, idx) => (
          <li key={idx}>{String(item)}</li>
        ))}
      </ul>
    );
  }

  // Object
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    const metrics = entries.filter(([k, v]) => typeof v === 'number');
    const others = entries.filter(([k, v]) => typeof v !== 'number');

    return (
      <div style={{ paddingLeft: depth > 0 ? '12px' : '0', borderLeft: depth > 0 ? '2px solid var(--border)' : 'none' }}>
        {metrics.length > 0 && (
          <div className="ai-output-metrics-row">
            {metrics.map(([k, v]) => (
              <RenderValue key={k} keyName={k} value={v} depth={depth + 1} />
            ))}
          </div>
        )}
        {others.map(([k, v]) => (
          <div key={k} className="ai-output-section">
            <div className="ai-output-heading">{toTitleCase(k)}</div>
            <RenderValue keyName={k} value={v} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(value)}</span>;
}

function AIOutput({ data, loading, error }) {
  if (loading) {
    return (
      <div className="ai-loading">
        <div className="spinner"></div>
        <p>AI is analyzing...</p>
      </div>
    );
  }

  if (error) {
    return <div className="ai-error">{error}</div>;
  }

  if (!data) return null;

  // If data is a string, try to parse it
  let parsed = data;
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data);
    } catch {
      return (
        <div className="ai-output">
          <div className="ai-output-header">AI Analysis Results</div>
          <div className="ai-output-body">
            <div className="ai-output-text">{data}</div>
          </div>
        </div>
      );
    }
  }

  // Handle { data: ... } wrapper
  const content = parsed.data || parsed.result || parsed.response || parsed;

  return (
    <div className="ai-output">
      <div className="ai-output-header">AI Analysis Results</div>
      <div className="ai-output-body">
        {typeof content === 'string' ? (
          <div className="ai-output-text">{content}</div>
        ) : (
          <RenderValue keyName="results" value={content} depth={0} />
        )}
      </div>
    </div>
  );
}

export default AIOutput;
