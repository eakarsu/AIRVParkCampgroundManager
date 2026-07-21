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
if ((process.env.JWT_SECRET || '').length < 32 || !process.env.GOVERNANCE_TENANT_ID || !process.env.DATABASE_URL) throw new Error('JWT_SECRET (32+ characters), GOVERNANCE_TENANT_ID, and DATABASE_URL are required');

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
if (process.env.ENABLE_GENERATED_ROUTES === 'true' && process.env.NODE_ENV !== 'production') app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/governed-campground-fulfillment', require('./governance'));
if (process.env.ENABLE_GENERATED_ROUTES === 'true' && process.env.NODE_ENV !== 'production') app.use('/api/ai/occupancy-forecast', require('./routes/ai-occupancy-forecast'));

app.use('/api/custom-views', require('./routes/customViews'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));

app.listen(PORT, () => {
  console.log(`RV Park Manager API running on port ${PORT}`);
});

module.exports = app;
