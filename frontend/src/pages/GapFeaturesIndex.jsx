import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const GAP_FEATURES = [
  {
    path: '/gap-no-cancellationrisk-noshow-prediction',
    title: 'Cancellation Risk / No-Show Prediction',
    desc: 'AI no-show probability scoring for reservations',
    icon: '🚫',
  },
  {
    path: '/gap-no-upsellrecommendations',
    title: 'Upsell Recommendations',
    desc: 'AI-driven upsell offers for active guests',
    icon: '💡',
  },
  {
    path: '/gap-no-guestsegmentation-cluster-by-behavior',
    title: 'Guest Segmentation',
    desc: 'Cluster guests by behavior for targeted offers',
    icon: '🔍',
  },
  {
    path: '/gap-no-occupancyforecast',
    title: 'Occupancy Forecast',
    desc: 'AI occupancy forecast beyond the revenue route',
    icon: '📈',
  },
  {
    path: '/gap-no-staffscheduling-optimization',
    title: 'Staff Scheduling Optimization',
    desc: 'AI-balanced shift and staffing planner',
    icon: '🗓️',
  },
  {
    path: '/gap-no-amenitydemandprediction',
    title: 'Amenity Demand Prediction',
    desc: 'Forecast per-amenity demand and capacity',
    icon: '🏊',
  },
  {
    path: '/gap-no-reviewresponse-ai-sister-product',
    title: 'Review Response AI',
    desc: 'AI-crafted responses to guest reviews',
    icon: '💬',
  },
  {
    path: '/gap-no-online-booking-widget-public-api',
    title: 'Online Booking Widget / Public API',
    desc: 'Public-facing booking widget and API endpoints',
    icon: '🌐',
  },
  {
    path: '/gap-no-automated-guest-communications-confirmati',
    title: 'Automated Guest Communications',
    desc: 'Confirmation, reminder, and review-request emails',
    icon: '📧',
  },
  {
    path: '/gap-no-payment-processor-integration-stripe-squa',
    title: 'Payment Processor Integration',
    desc: 'Stripe / Square payment gateway integration',
    icon: '💳',
  },
  {
    path: '/gap-limited-housekeepingmaintenance-ticketing-on',
    title: 'Housekeeping / Maintenance Ticketing',
    desc: 'Full housekeeping ticket system beyond basic stub',
    icon: '🔧',
  },
  {
    path: '/gap-no-notificationssms-system',
    title: 'Notifications / SMS System',
    desc: 'SMS and push notification delivery for guests',
    icon: '📱',
  },
  {
    path: '/gap-no-pms-integration-other-park-systems',
    title: 'PMS Integration',
    desc: 'Connect to other property management systems',
    icon: '🔗',
  },
  {
    path: '/gap-no-reporting-export-beyond-revenue-route',
    title: 'Reporting & Export',
    desc: 'Full reporting and CSV/PDF export beyond revenue',
    icon: '📊',
  },
];

export default function GapFeaturesIndex() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Gap Features</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          AI-powered features that extend AIRVParkCampgroundManager beyond its core modules.
          Each panel lets you submit context and receive an AI analysis in real time.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {GAP_FEATURES.map((f) => (
            <div
              key={f.path}
              onClick={() => navigate(f.path)}
              style={{
                border: '1px solid #ddd',
                borderRadius: 10,
                padding: '18px 20px',
                cursor: 'pointer',
                background: '#fff',
                transition: 'box-shadow 0.15s',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: 28 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{f.title}</div>
              <div style={{ color: '#666', fontSize: 13 }}>{f.desc}</div>
              <div style={{ marginTop: 8 }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  background: '#111',
                  color: '#fff',
                  borderRadius: 20,
                  fontSize: 12,
                }}>Open AI Panel &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
