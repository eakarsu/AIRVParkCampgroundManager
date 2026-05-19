import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className="nav-bar">
      <Link to="/dashboard" className="nav-brand">
        <span className="nav-icon">🏕️</span>
        RV Park Manager
      </Link>
      <div className="nav-links">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/reservations" className="nav-link">Reservations</Link>
        <Link to="/sites" className="nav-link">Sites</Link>
        <Link to="/guests" className="nav-link">Guests</Link>
        <Link to="/custom-views" className="nav-link">Park Views</Link>
      </div>
      <div className="nav-user">
        <span className="nav-user-name">{user.name || user.email || 'Admin'}</span>
        <button className="nav-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
