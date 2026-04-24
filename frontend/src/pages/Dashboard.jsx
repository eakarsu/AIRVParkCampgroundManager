import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../api';

const sections = [
  {
    title: 'Operations',
    cardClass: 'operations',
    items: [
      { icon: '🏕️', title: 'Site Inventory', desc: 'Manage campsites & hookups', path: '/sites', endpoint: '/sites' },
      { icon: '📅', title: 'Reservations', desc: 'Bookings & scheduling', path: '/reservations', endpoint: '/reservations' },
      { icon: '🔑', title: 'Check-in/Check-out', desc: 'Guest arrivals & departures', path: '/checkinout', endpoint: '/checkinout' },
      { icon: '👥', title: 'Guest Profiles', desc: 'Guest information & history', path: '/guests', endpoint: '/guests' },
      { icon: '💰', title: 'Rate Management', desc: 'Pricing & seasonal rates', path: '/rates', endpoint: '/rates' },
    ]
  },
  {
    title: 'Facilities',
    cardClass: 'facilities',
    items: [
      { icon: '⚡', title: 'Utility Metering', desc: 'Electric, water & sewer', path: '/utilities', endpoint: '/utilities' },
      { icon: '🏠', title: 'Long-term Residents', desc: 'Monthly & seasonal stays', path: '/longterm', endpoint: '/long-term' },
      { icon: '🏊', title: 'Amenities', desc: 'Pool, rec hall & more', path: '/amenities', endpoint: '/amenities' },
      { icon: '📋', title: 'Amenity Bookings', desc: 'Facility reservations', path: '/amenity-bookings', endpoint: '/amenity-bookings' },
      { icon: '🔧', title: 'Maintenance', desc: 'Work orders & repairs', path: '/maintenance', endpoint: '/maintenance' },
    ]
  },
  {
    title: 'Store & Supplies',
    cardClass: 'store-supplies',
    items: [
      { icon: '🛒', title: 'Camp Store', desc: 'Inventory management', path: '/store', endpoint: '/store' },
      { icon: '💳', title: 'Transactions', desc: 'Store sales & receipts', path: '/transactions', endpoint: '/store-transactions' },
      { icon: '🔥', title: 'Propane Sales', desc: 'Tank fills & deliveries', path: '/propane', endpoint: '/propane' },
      { icon: '🪵', title: 'Firewood', desc: 'Wood inventory & sales', path: '/firewood', endpoint: '/firewood' },
      { icon: '🚿', title: 'Dump Station', desc: 'Waste disposal tracking', path: '/dump-station', endpoint: '/dump-station' },
    ]
  },
  {
    title: 'Administration',
    cardClass: 'admin',
    items: [
      { icon: '⭐', title: 'Loyalty & Rewards', desc: 'Points & member perks', path: '/loyalty', endpoint: '/loyalty' },
      { icon: '📊', title: 'Revenue Reports', desc: 'Financial analytics', path: '/revenue', endpoint: '/revenue' },
      { icon: '🔒', title: 'Security Access', desc: 'Gate logs & access codes', path: '/security', endpoint: '/security' },
      { icon: '📦', title: 'Mail & Packages', desc: 'Guest mail tracking', path: '/mail', endpoint: '/mail-packages' },
    ]
  },
  {
    title: 'AI Tools',
    cardClass: 'ai-card',
    items: [
      { icon: '🤖', title: 'Dynamic Pricing', desc: 'AI-optimized rate suggestions', path: '/ai/dynamic-pricing' },
      { icon: '💬', title: 'Review Responses', desc: 'AI-crafted review replies', path: '/ai/review-response' },
      { icon: '🗺️', title: 'Activity Guide', desc: 'Personalized recommendations', path: '/ai/activity-recommendations' },
      { icon: '🎯', title: 'Site Matching', desc: 'Smart site assignments', path: '/ai/site-matching' },
      { icon: '📢', title: 'Marketing Content', desc: 'AI-generated campaigns', path: '/ai/marketing-content' },
      { icon: '🔮', title: 'Maintenance AI', desc: 'Predictive maintenance', path: '/ai/maintenance-prediction' },
    ]
  }
];

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [counts, setCounts] = useState({});
  const [stats, setStats] = useState({ sites: 0, reservations: 0, guests: 0, revenue: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const endpoints = [
        { key: 'sites', path: '/sites' },
        { key: 'reservations', path: '/reservations' },
        { key: 'guests', path: '/guests' },
        { key: 'maintenance', path: '/maintenance' },
        { key: 'store', path: '/store' },
        { key: 'amenities', path: '/amenities' },
      ];
      for (const ep of endpoints) {
        try {
          const data = await api.get(ep.path);
          const arr = Array.isArray(data) ? data : (data.data || []);
          setCounts(prev => ({ ...prev, [ep.path]: arr.length }));
          if (ep.key === 'sites') setStats(prev => ({ ...prev, sites: arr.length }));
          if (ep.key === 'reservations') setStats(prev => ({ ...prev, reservations: arr.length }));
          if (ep.key === 'guests') setStats(prev => ({ ...prev, guests: arr.length }));
        } catch (e) { /* ignore */ }
      }
      try {
        const revData = await api.get('/revenue');
        const revArr = Array.isArray(revData) ? revData : (revData.data || []);
        const total = revArr.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        setStats(prev => ({ ...prev, revenue: total }));
        setCounts(prev => ({ ...prev, '/revenue': revArr.length }));
      } catch (e) { /* ignore */ }
    };
    fetchCounts();
  }, []);

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Welcome back, {user.name || user.email || 'Admin'}</h1>
            <p>Here is your park overview for today</p>
          </div>
        </div>

        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-label">Total Sites</div>
            <div className="stat-value">{stats.sites}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Reservations</div>
            <div className="stat-value">{stats.reservations}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Registered Guests</div>
            <div className="stat-value">{stats.guests}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        {sections.map((section) => (
          <div className="dashboard-section" key={section.title}>
            <h2>{section.title}</h2>
            <div className="dashboard-grid">
              {section.items.map((item) => (
                <div
                  key={item.path}
                  className={`feature-card ${section.cardClass}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="card-icon">{item.icon}</span>
                  <div className="card-title">{item.title}</div>
                  <div className="card-desc">{item.desc}</div>
                  {item.endpoint && counts[item.endpoint] !== undefined && (
                    <span className="card-count">{counts[item.endpoint]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default Dashboard;
