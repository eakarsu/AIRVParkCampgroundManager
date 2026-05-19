const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Validate API key on startup
if (!process.env.OPENROUTER_API_KEY) {
  console.warn('WARNING: OPENROUTER_API_KEY is not set. AI features will fail.');
}

const app = express();
const PORT = process.env.BACKEND_PORT || 4001;

// Security middleware
let helmet;
try { helmet = require('helmet'); } catch (_) { helmet = null; }
if (helmet) app.use(helmet());

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/checkinout', require('./routes/checkinout'));
app.use('/api/utility-readings', require('./routes/utilities'));
app.use('/api/utilities', require('./routes/utilities'));
app.use('/api/guests', require('./routes/guests'));
app.use('/api/rates', require('./routes/rates'));
app.use('/api/longterm', require('./routes/longterm'));
app.use('/api/amenities', require('./routes/amenities'));
app.use('/api/amenity-bookings', require('./routes/amenityBookings'));
app.use('/api/store-items', require('./routes/storeItems'));
app.use('/api/store-transactions', require('./routes/storeTransactions'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/loyalty', require('./routes/loyalty'));
app.use('/api/revenue', require('./routes/revenue'));
app.use('/api/security', require('./routes/security'));
app.use('/api/mail', require('./routes/mail'));
app.use('/api/propane', require('./routes/propane'));
app.use('/api/firewood', require('./routes/firewood'));
app.use('/api/dump-station', require('./routes/dumpStation'));
app.use('/api/ai', require('./routes/ai'));

// Auto-migrate: create ai_results table if missing
const pool = require('./db');
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_results (
    id SERIAL PRIMARY KEY,
    feature VARCHAR(100) NOT NULL,
    input_summary TEXT,
    result_text TEXT,
    result_json JSONB,
    model_used VARCHAR(100),
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.warn('ai_results table migration failed:', err.message));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`RV Park Manager API running on port ${PORT}`);
});

module.exports = app;

// AI feature mount: occupancy-forecast
app.use('/api/ai/occupancy-forecast', require('./routes/ai-occupancy-forecast'));
// === Batch 07 Gaps & Frontend Mounts ===
app.use('/api/gap-no-cancellationrisk-noshow-prediction', require('./routes/gap-no-cancellationrisk-noshow-prediction'));
app.use('/api/gap-no-upsellrecommendations', require('./routes/gap-no-upsellrecommendations'));
app.use('/api/gap-no-guestsegmentation-cluster-by-behavior', require('./routes/gap-no-guestsegmentation-cluster-by-behavior'));
app.use('/api/gap-no-occupancyforecast', require('./routes/gap-no-occupancyforecast'));
app.use('/api/gap-no-staffscheduling-optimization', require('./routes/gap-no-staffscheduling-optimization'));
app.use('/api/gap-no-amenitydemandprediction', require('./routes/gap-no-amenitydemandprediction'));
app.use('/api/gap-no-reviewresponse-ai-sister-product', require('./routes/gap-no-reviewresponse-ai-sister-product'));
app.use('/api/gap-no-online-booking-widget-public-api', require('./routes/gap-no-online-booking-widget-public-api'));
app.use('/api/gap-no-automated-guest-communications-confirmati', require('./routes/gap-no-automated-guest-communications-confirmati'));
app.use('/api/gap-no-payment-processor-integration-stripe-squa', require('./routes/gap-no-payment-processor-integration-stripe-squa'));
app.use('/api/gap-limited-housekeepingmaintenance-ticketing-on', require('./routes/gap-limited-housekeepingmaintenance-ticketing-on'));
app.use('/api/gap-no-notificationssms-system', require('./routes/gap-no-notificationssms-system'));
app.use('/api/gap-no-pms-integration-other-park-systems', require('./routes/gap-no-pms-integration-other-park-systems'));
app.use('/api/gap-no-reporting-export-beyond-revenue-route', require('./routes/gap-no-reporting-export-beyond-revenue-route'));
// === End Batch 07 ===

// === Custom Views (mount BEFORE 404 handler) ===
app.use('/api/custom-views', require('./routes/customViews'));

// 404 handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});
