import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './AppSidebar.css';

const STATIC_LINKS = [
  { to: '/insights/timeline', label: 'Timeline View', group: 'Insights' },
  { to: '/codex/custom-viz', label: 'Custom Viz', group: 'Insights' },
  { to: '/codex/operations', label: 'Operations', group: 'Insights' },
  { to: '/dashboard', label: 'Dashboard', group: 'Workspace' },
  { to: '/sites', label: 'Site Inventory', group: 'Workspace' },
  { to: '/reservations', label: 'Reservations', group: 'Workspace' },
  { to: '/checkinout', label: 'Check In Out', group: 'Workspace' },
  { to: '/utilities', label: 'Utilities', group: 'Workspace' },
  { to: '/guests', label: 'Guests', group: 'Workspace' },
  { to: '/rates', label: 'Rates', group: 'Workspace' },
  { to: '/longterm', label: 'Long Term Residents', group: 'Workspace' },
  { to: '/amenities', label: 'Amenities', group: 'Workspace' },
  { to: '/amenity-bookings', label: 'Amenity Bookings', group: 'Workspace' },
  { to: '/store', label: 'Store', group: 'Workspace' },
  { to: '/transactions', label: 'Store Transactions', group: 'Workspace' },
  { to: '/maintenance', label: 'Maintenance', group: 'Workspace' },
  { to: '/loyalty', label: 'Loyalty', group: 'Workspace' },
  { to: '/revenue', label: 'Revenue', group: 'Workspace' },
  { to: '/security', label: 'Security', group: 'Workspace' },
  { to: '/mail', label: 'Mail Packages', group: 'Workspace' },
  { to: '/propane', label: 'Propane', group: 'Workspace' },
  { to: '/firewood', label: 'Firewood', group: 'Workspace' },
  { to: '/dump-station', label: 'Dump Station', group: 'Workspace' },
  { to: '/ai/dynamic-pricing', label: 'AI Dynamic Pricing', group: 'AI tools' },
  { to: '/ai/review-response', label: 'AI Review Response', group: 'AI tools' },
  { to: '/ai/activity-recommendations', label: 'AI Activity Recommendations', group: 'AI tools' },
  { to: '/ai/site-matching', label: 'AI Site Matching', group: 'AI tools' },
  { to: '/ai/marketing-content', label: 'AI Marketing Content', group: 'AI tools' },
  { to: '/ai/maintenance-prediction', label: 'AI Maintenance Prediction', group: 'AI tools' },
  { to: '/ai/occupancy-forecast', label: 'AI Occupancy Forecast', group: 'AI tools' },
  { to: '/ai/upsell-recommendations', label: 'AI Upsell Recommendations', group: 'AI tools' },
  { to: '/ai/cancellation-risk', label: 'AI Cancellation Risk', group: 'AI tools' },
  { to: '/ai/guest-segmentation', label: 'AI Guest Segmentation', group: 'AI tools' },
  { to: '/ai/staff-scheduling', label: 'AI Staff Scheduling', group: 'AI tools' },
  { to: '/ai/amenity-demand-prediction', label: 'AI Amenity Demand Prediction', group: 'AI tools' },
  { to: '/cf-dynamic-pricing-by-occupancy-demand-season', label: 'Cf Dynamic Pricing By Occupancy Demand Season', group: 'Workspace' },
  { to: '/cf-guest-lifetime-value-maximization', label: 'Cf Guest Lifetime Value Maximization', group: 'Workspace' },
  { to: '/cf-occupancy-forecasting-recommendations', label: 'Cf Occupancy Forecasting Recommendations', group: 'Workspace' },
  { to: '/cf-maintenance-routing-optimization', label: 'Cf Maintenance Routing Optimization', group: 'Workspace' },
  { to: '/cf-amenity-demand-forecasting', label: 'Cf Amenity Demand Forecasting', group: 'Workspace' },
  { to: '/cf-reviewresponsive-marketing', label: 'Cf Reviewresponsive Marketing', group: 'Workspace' },
  { to: '/gap-no-cancellationrisk-noshow-prediction', label: 'Gap No Cancellationrisk Noshow Prediction', group: 'Workspace' },
  { to: '/gap-no-upsellrecommendations', label: 'Gap No Upsellrecommendations', group: 'Workspace' },
  { to: '/gap-no-guestsegmentation-cluster-by-behavior', label: 'Gap No Guestsegmentation Cluster By Behavior', group: 'Workspace' },
  { to: '/gap-no-occupancyforecast', label: 'Gap No Occupancyforecast', group: 'Workspace' },
  { to: '/gap-no-staffscheduling-optimization', label: 'Gap No Staffscheduling Optimization', group: 'Workspace' },
  { to: '/gap-no-amenitydemandprediction', label: 'Gap No Amenitydemandprediction', group: 'Workspace' },
  { to: '/gap-no-reviewresponse-ai-sister-product', label: 'Gap No Reviewresponse Ai Sister Product', group: 'Workspace' },
  { to: '/gap-no-online-booking-widget-public-api', label: 'Gap No Online Booking Widget Public Api', group: 'Workspace' },
  { to: '/gap-no-automated-guest-communications-confirmati', label: 'Gap No Automated Guest Communications Confirmati', group: 'Workspace' },
  { to: '/gap-no-payment-processor-integration-stripe-squa', label: 'Gap No Payment Processor Integration Stripe Squa', group: 'Workspace' },
  { to: '/gap-limited-housekeepingmaintenance-ticketing-on', label: 'Gap Limited Housekeepingmaintenance Ticketing On', group: 'Workspace' },
  { to: '/gap-no-notificationssms-system', label: 'Gap No Notificationssms System', group: 'Workspace' },
  { to: '/gap-no-pms-integration-other-park-systems', label: 'Gap No Pms Integration Other Park Systems', group: 'Workspace' },
  { to: '/gap-no-reporting-export-beyond-revenue-route', label: 'Gap No Reporting Export Beyond Revenue Route', group: 'Workspace' },
  { to: '/custom-views', label: 'Custom Views', group: 'Workspace' },
  { to: '/gap-features', label: 'Gap Features Index', group: 'Workspace' },
];

export default function AppSidebar({ extraLinks = [] }) {
  const LINKS = [...STATIC_LINKS, ...extraLinks];
  const [query, setQuery] = useState('');
  const visible = LINKS.filter(link => link.label.toLowerCase().includes(query.toLowerCase().trim()));
  return <aside className="codex-side" aria-label="Application navigation">
    <div className="codex-side-brand"><strong>AIRVPark Campground Manager</strong><span>Workspace</span></div>
    <label className="codex-side-search-label" htmlFor="codex-side-search">Find a section</label>
    <input id="codex-side-search" className="codex-side-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search navigation" />
    <nav className="codex-side-links" aria-label="Sections">
      {['Workspace', 'AI tools', 'Insights'].map(group => {
        const items = visible.filter(link => link.group === group);
        return items.length ? <div className="codex-side-group" key={group}>
          <span className="codex-side-heading">{group}</span>
          {items.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `codex-side-link${isActive ? ' active' : ''}`}>{link.label}</NavLink>)}
        </div> : null;
      })}
      {visible.length === 0 && <p className="codex-side-empty">No matching sections</p>}
    </nav>
  </aside>;
}
