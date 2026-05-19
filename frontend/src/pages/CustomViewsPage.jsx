import React from 'react';
import Navbar from '../components/Navbar';
import OccupancyTimeline from '../components/OccupancyTimeline';
import SiteUtilizationHeatmap from '../components/SiteUtilizationHeatmap';
import ReservationConfirmationPDF from '../components/ReservationConfirmationPDF';
import PricingRulesEditor from '../components/PricingRulesEditor';

function CustomViewsPage() {
  return (
    <>
      <Navbar />
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: '#2E7D32', margin: '0 0 6px' }}>Park Views</h1>
          <p style={{ color: '#666', margin: 0 }}>
            Custom visualizations and admin tools: occupancy timeline, site utilization, PDF confirmations, and pricing rules editor.
          </p>
        </div>

        <section style={{ marginBottom: 24 }}>
          <OccupancyTimeline />
        </section>

        <section style={{ marginBottom: 24 }}>
          <SiteUtilizationHeatmap />
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 24 }}>
          <section>
            <ReservationConfirmationPDF />
          </section>
          <section>
            <PricingRulesEditor />
          </section>
        </div>
      </div>
    </>
  );
}

export default CustomViewsPage;
