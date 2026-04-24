const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 4001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/checkinout', require('./routes/checkinout'));
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`RV Park Manager API running on port ${PORT}`);
});

module.exports = app;
