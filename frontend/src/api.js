const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: getHeaders() });
    if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/'; throw new Error('Unauthorized'); }
    return res.json();
  },
  post: async (path, data) => {
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/'; throw new Error('Unauthorized'); }
    return res.json();
  },
  put: async (path, data) => {
    const res = await fetch(`${API_BASE}${path}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) });
    if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/'; throw new Error('Unauthorized'); }
    return res.json();
  },
  delete: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: getHeaders() });
    if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/'; throw new Error('Unauthorized'); }
    return res.json();
  }
};
