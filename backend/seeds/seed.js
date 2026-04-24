const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rv_park_manager',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Starting database seed...');

    // Drop tables in reverse dependency order
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS dump_station_logs CASCADE;
      DROP TABLE IF EXISTS firewood_inventory CASCADE;
      DROP TABLE IF EXISTS propane_sales CASCADE;
      DROP TABLE IF EXISTS mail_packages CASCADE;
      DROP TABLE IF EXISTS security_logs CASCADE;
      DROP TABLE IF EXISTS revenue_records CASCADE;
      DROP TABLE IF EXISTS loyalty_rewards CASCADE;
      DROP TABLE IF EXISTS maintenance_orders CASCADE;
      DROP TABLE IF EXISTS store_transactions CASCADE;
      DROP TABLE IF EXISTS store_items CASCADE;
      DROP TABLE IF EXISTS amenity_bookings CASCADE;
      DROP TABLE IF EXISTS amenities CASCADE;
      DROP TABLE IF EXISTS longterm_residents CASCADE;
      DROP TABLE IF EXISTS rates CASCADE;
      DROP TABLE IF EXISTS utility_readings CASCADE;
      DROP TABLE IF EXISTS checkin_checkout CASCADE;
      DROP TABLE IF EXISTS reservations CASCADE;
      DROP TABLE IF EXISTS guests CASCADE;
      DROP TABLE IF EXISTS sites CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('Tables dropped.');

    // Create tables
    console.log('Creating tables...');

    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - users table created');

    await client.query(`
      CREATE TABLE sites (
        id SERIAL PRIMARY KEY,
        site_number VARCHAR(20) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'available',
        length_ft INTEGER,
        width_ft INTEGER,
        max_rig_length INTEGER,
        has_slides_room BOOLEAN DEFAULT false,
        amp_service INTEGER DEFAULT 30,
        has_water BOOLEAN DEFAULT true,
        has_sewer BOOLEAN DEFAULT true,
        wifi_tier VARCHAR(20) DEFAULT 'basic',
        daily_rate DECIMAL(10,2),
        weekly_rate DECIMAL(10,2),
        monthly_rate DECIMAL(10,2),
        seasonal_rate DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - sites table created');

    await client.query(`
      CREATE TABLE guests (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        rig_type VARCHAR(50),
        rig_length INTEGER,
        rig_slides INTEGER DEFAULT 0,
        license_plate VARCHAR(20),
        pet_info TEXT,
        loyalty_points INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - guests table created');

    await client.query(`
      CREATE TABLE reservations (
        id SERIAL PRIMARY KEY,
        site_id INTEGER REFERENCES sites(id),
        guest_id INTEGER REFERENCES guests(id),
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'confirmed',
        total_amount DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - reservations table created');

    await client.query(`
      CREATE TABLE checkin_checkout (
        id SERIAL PRIMARY KEY,
        reservation_id INTEGER REFERENCES reservations(id),
        guest_id INTEGER REFERENCES guests(id),
        site_id INTEGER REFERENCES sites(id),
        type VARCHAR(20) NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        processed_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - checkin_checkout table created');

    await client.query(`
      CREATE TABLE utility_readings (
        id SERIAL PRIMARY KEY,
        site_id INTEGER REFERENCES sites(id),
        reading_date DATE NOT NULL,
        electric_kwh DECIMAL(10,2),
        water_gallons DECIMAL(10,2),
        sewer_gallons DECIMAL(10,2),
        amount_due DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - utility_readings table created');

    await client.query(`
      CREATE TABLE rates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        rate_type VARCHAR(50) NOT NULL,
        site_type VARCHAR(50),
        amount DECIMAL(10,2) NOT NULL,
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - rates table created');

    await client.query(`
      CREATE TABLE longterm_residents (
        id SERIAL PRIMARY KEY,
        guest_id INTEGER REFERENCES guests(id),
        site_id INTEGER REFERENCES sites(id),
        lease_start DATE NOT NULL,
        lease_end DATE NOT NULL,
        monthly_rate DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - longterm_residents table created');

    await client.query(`
      CREATE TABLE amenities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        capacity INTEGER,
        status VARCHAR(50) DEFAULT 'open',
        rate_per_hour DECIMAL(10,2) DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - amenities table created');

    await client.query(`
      CREATE TABLE amenity_bookings (
        id SERIAL PRIMARY KEY,
        amenity_id INTEGER REFERENCES amenities(id),
        guest_id INTEGER REFERENCES guests(id),
        booking_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'confirmed',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - amenity_bookings table created');

    await client.query(`
      CREATE TABLE store_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER DEFAULT 0,
        sku VARCHAR(50) UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - store_items table created');

    await client.query(`
      CREATE TABLE store_transactions (
        id SERIAL PRIMARY KEY,
        guest_id INTEGER REFERENCES guests(id),
        items JSONB NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cash',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - store_transactions table created');

    await client.query(`
      CREATE TABLE maintenance_orders (
        id SERIAL PRIMARY KEY,
        site_id INTEGER REFERENCES sites(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'open',
        assigned_to VARCHAR(100),
        due_date DATE,
        completed_date DATE,
        cost DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - maintenance_orders table created');

    await client.query(`
      CREATE TABLE loyalty_rewards (
        id SERIAL PRIMARY KEY,
        guest_id INTEGER REFERENCES guests(id),
        points INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - loyalty_rewards table created');

    await client.query(`
      CREATE TABLE revenue_records (
        id SERIAL PRIMARY KEY,
        source VARCHAR(100) NOT NULL,
        site_id INTEGER REFERENCES sites(id),
        amount DECIMAL(10,2) NOT NULL,
        revenue_date DATE NOT NULL,
        category VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - revenue_records table created');

    await client.query(`
      CREATE TABLE security_logs (
        id SERIAL PRIMARY KEY,
        gate_name VARCHAR(100) NOT NULL,
        guest_id INTEGER REFERENCES guests(id),
        access_code VARCHAR(50),
        action VARCHAR(50) NOT NULL,
        vehicle_info TEXT,
        notes TEXT,
        timestamp TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - security_logs table created');

    await client.query(`
      CREATE TABLE mail_packages (
        id SERIAL PRIMARY KEY,
        guest_id INTEGER REFERENCES guests(id),
        type VARCHAR(50) NOT NULL,
        sender VARCHAR(255),
        tracking_number VARCHAR(100),
        status VARCHAR(50) DEFAULT 'received',
        received_date TIMESTAMP DEFAULT NOW(),
        picked_up_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - mail_packages table created');

    await client.query(`
      CREATE TABLE propane_sales (
        id SERIAL PRIMARY KEY,
        guest_id INTEGER REFERENCES guests(id),
        gallons DECIMAL(10,2) NOT NULL,
        price_per_gallon DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        tank_size VARCHAR(50),
        sale_date TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - propane_sales table created');

    await client.query(`
      CREATE TABLE firewood_inventory (
        id SERIAL PRIMARY KEY,
        wood_type VARCHAR(100) NOT NULL,
        quantity_bundles INTEGER NOT NULL,
        price_per_bundle DECIMAL(10,2) NOT NULL,
        supplier VARCHAR(255),
        last_restocked DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - firewood_inventory table created');

    await client.query(`
      CREATE TABLE dump_station_logs (
        id SERIAL PRIMARY KEY,
        site_id INTEGER REFERENCES sites(id),
        guest_id INTEGER REFERENCES guests(id),
        station_number INTEGER NOT NULL,
        usage_date TIMESTAMP DEFAULT NOW(),
        duration_minutes INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  - dump_station_logs table created');

    // Seed data
    console.log('\nSeeding data...');

    // Users
    const adminHash = await bcrypt.hash('admin123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);
    await client.query(`
      INSERT INTO users (email, password_hash, name, role) VALUES
      ('admin@rvpark.com', $1, 'Park Administrator', 'admin'),
      ('manager@rvpark.com', $2, 'Sarah Johnson', 'manager'),
      ('front@rvpark.com', $2, 'Mike Chen', 'staff'),
      ('maint@rvpark.com', $2, 'Tom Rodriguez', 'staff')
    `, [adminHash, staffHash]);
    console.log('  - users seeded (4 records)');

    // Sites - 23 sites
    await client.query(`
      INSERT INTO sites (site_number, type, status, length_ft, width_ft, max_rig_length, has_slides_room, amp_service, has_water, has_sewer, wifi_tier, daily_rate, weekly_rate, monthly_rate, seasonal_rate, notes) VALUES
      ('A1', 'full_hookup', 'occupied', 60, 20, 45, true, 50, true, true, 'premium', 65.00, 390.00, 1400.00, 3800.00, 'Premium pull-through site near lake'),
      ('A2', 'full_hookup', 'available', 60, 20, 45, true, 50, true, true, 'premium', 65.00, 390.00, 1400.00, 3800.00, 'Premium pull-through site near lake'),
      ('A3', 'full_hookup', 'reserved', 55, 18, 40, true, 50, true, true, 'standard', 55.00, 330.00, 1200.00, 3300.00, 'Back-in site with shade trees'),
      ('A4', 'full_hookup', 'available', 55, 18, 40, true, 30, true, true, 'standard', 50.00, 300.00, 1100.00, 3000.00, 'Back-in site near playground'),
      ('A5', 'full_hookup', 'occupied', 65, 22, 50, true, 50, true, true, 'premium', 70.00, 420.00, 1500.00, 4100.00, 'Extra-wide pull-through, big rig friendly'),
      ('A6', 'full_hookup', 'maintenance', 50, 18, 38, false, 30, true, true, 'basic', 45.00, 270.00, 1000.00, 2700.00, 'Water hookup under repair'),
      ('A7', 'full_hookup', 'available', 55, 20, 42, true, 50, true, true, 'standard', 55.00, 330.00, 1200.00, 3300.00, 'Corner lot with extra privacy'),
      ('A8', 'full_hookup', 'occupied', 60, 20, 45, true, 50, true, true, 'premium', 65.00, 390.00, 1400.00, 3800.00, 'Near bathhouse and laundry'),
      ('B1', 'water_electric', 'available', 45, 16, 35, false, 30, true, false, 'basic', 35.00, 210.00, 800.00, 2200.00, 'Water and electric only'),
      ('B2', 'water_electric', 'occupied', 45, 16, 35, false, 30, true, false, 'basic', 35.00, 210.00, 800.00, 2200.00, 'Near dump station'),
      ('B3', 'water_electric', 'available', 50, 18, 38, true, 50, true, false, 'standard', 40.00, 240.00, 900.00, 2500.00, 'Upgraded 50 amp service'),
      ('B4', 'water_electric', 'reserved', 45, 16, 35, false, 30, true, false, 'basic', 35.00, 210.00, 800.00, 2200.00, 'Shaded site'),
      ('B5', 'water_electric', 'available', 45, 16, 35, false, 30, true, false, 'standard', 38.00, 228.00, 850.00, 2350.00, 'Near hiking trail entrance'),
      ('T1', 'tent', 'available', 20, 15, NULL, false, 0, false, false, 'basic', 20.00, 120.00, NULL, NULL, 'Flat grassy tent pad with fire ring'),
      ('T2', 'tent', 'occupied', 20, 15, NULL, false, 0, false, false, 'basic', 20.00, 120.00, NULL, NULL, 'Wooded tent site with picnic table'),
      ('T3', 'tent', 'available', 25, 20, NULL, false, 0, true, false, 'basic', 25.00, 150.00, NULL, NULL, 'Premium tent site with water spigot'),
      ('T4', 'tent', 'available', 20, 15, NULL, false, 0, false, false, 'basic', 20.00, 120.00, NULL, NULL, 'Riverside tent site'),
      ('T5', 'tent', 'reserved', 20, 15, NULL, false, 0, false, false, 'basic', 22.00, 132.00, NULL, NULL, 'Group tent area'),
      ('C1', 'cabin', 'available', 24, 16, NULL, false, 0, true, true, 'premium', 120.00, 720.00, 2500.00, NULL, 'Deluxe cabin with kitchen, sleeps 6'),
      ('C2', 'cabin', 'occupied', 20, 14, NULL, false, 0, true, true, 'premium', 100.00, 600.00, 2100.00, NULL, 'Standard cabin, sleeps 4'),
      ('C3', 'cabin', 'available', 24, 16, NULL, false, 0, true, true, 'premium', 120.00, 720.00, 2500.00, NULL, 'Deluxe cabin with deck and lake view'),
      ('C4', 'cabin', 'maintenance', 16, 12, NULL, false, 0, true, true, 'standard', 80.00, 480.00, 1700.00, NULL, 'Rustic cabin, roof repair needed'),
      ('C5', 'cabin', 'available', 20, 14, NULL, false, 0, true, true, 'premium', 110.00, 660.00, 2300.00, NULL, 'Pet-friendly cabin with fenced yard')
    `);
    console.log('  - sites seeded (23 records)');

    // Guests - 18 guests
    await client.query(`
      INSERT INTO guests (first_name, last_name, email, phone, rig_type, rig_length, rig_slides, license_plate, pet_info, loyalty_points, notes) VALUES
      ('Robert', 'Mitchell', 'rmitchell@email.com', '555-0101', 'Class A', 38, 3, 'TX-ABC1234', '2 dogs: Golden Retriever, Beagle', 1250, 'Prefers pull-through sites'),
      ('Linda', 'Garcia', 'lgarcia@email.com', '555-0102', 'Fifth Wheel', 34, 2, 'CA-XYZ5678', NULL, 850, 'Snowbird, stays Nov-Mar'),
      ('James', 'Wilson', 'jwilson@email.com', '555-0103', 'Travel Trailer', 28, 1, 'FL-DEF9012', '1 cat', 400, NULL),
      ('Patricia', 'Anderson', 'panderson@email.com', '555-0104', 'Class C', 30, 1, 'AZ-GHI3456', NULL, 2100, 'Long-term resident since 2023'),
      ('Michael', 'Thompson', 'mthompson@email.com', '555-0105', 'Class A', 42, 4, 'CO-JKL7890', '1 dog: German Shepherd', 3500, 'VIP guest, frequent visitor'),
      ('Jennifer', 'Martinez', 'jmartinez@email.com', '555-0106', 'Travel Trailer', 24, 0, 'NM-MNO1234', NULL, 150, 'First-time RVer'),
      ('David', 'Brown', 'dbrown@email.com', '555-0107', 'Fifth Wheel', 36, 2, 'OR-PQR5678', '2 cats', 920, 'Needs 50 amp service'),
      ('Susan', 'Taylor', 'staylor@email.com', '555-0108', 'Tent', NULL, 0, NULL, NULL, 75, 'Weekend camper'),
      ('Richard', 'Davis', 'rdavis@email.com', '555-0109', 'Class B', 22, 0, 'WA-STU9012', '1 small dog: Chihuahua', 600, 'Solo traveler'),
      ('Karen', 'White', 'kwhite@email.com', '555-0110', 'Class A', 36, 2, 'NV-VWX3456', NULL, 1800, 'Full-timer'),
      ('William', 'Harris', 'wharris@email.com', '555-0111', 'Travel Trailer', 26, 1, 'UT-YZA7890', '1 dog: Labrador', 300, NULL),
      ('Nancy', 'Clark', 'nclark@email.com', '555-0112', 'Tent', NULL, 0, NULL, NULL, 50, 'Family camper with 3 kids'),
      ('Thomas', 'Lewis', 'tlewis@email.com', '555-0113', 'Fifth Wheel', 40, 3, 'MT-BCD1234', NULL, 2750, 'Seasonal resident'),
      ('Betty', 'Robinson', 'brobinson@email.com', '555-0114', 'Class C', 26, 1, 'ID-EFG5678', '3 dogs: Poodles', 450, 'Needs pet-friendly site'),
      ('Charles', 'Walker', 'cwalker@email.com', '555-0115', 'Class A', 34, 2, 'WY-HIJ9012', NULL, 1100, 'Rally group leader'),
      ('Margaret', 'Hall', 'mhall@email.com', '555-0116', 'Travel Trailer', 20, 0, 'SD-KLM3456', '1 cat', 200, 'Quiet hours important'),
      ('Daniel', 'Young', 'dyoung@email.com', '555-0117', 'Tent', NULL, 0, NULL, NULL, 25, 'Backpacker'),
      ('Dorothy', 'King', 'dking@email.com', '555-0118', 'None', NULL, 0, NULL, NULL, 500, 'Cabin guest only')
    `);
    console.log('  - guests seeded (18 records)');

    // Reservations - 18 reservations
    await client.query(`
      INSERT INTO reservations (site_id, guest_id, check_in, check_out, status, total_amount, notes) VALUES
      (1, 1, '2026-03-15', '2026-03-22', 'checked_in', 455.00, 'Week-long stay, site A1'),
      (5, 5, '2026-03-10', '2026-04-10', 'checked_in', 1500.00, 'Monthly stay'),
      (8, 10, '2026-03-18', '2026-03-25', 'checked_in', 455.00, NULL),
      (3, 3, '2026-03-25', '2026-03-30', 'confirmed', 275.00, 'Arriving late Friday'),
      (10, 7, '2026-03-20', '2026-03-27', 'checked_in', 245.00, NULL),
      (15, 8, '2026-03-22', '2026-03-24', 'checked_in', 40.00, 'Tent camping weekend'),
      (20, 18, '2026-03-19', '2026-03-26', 'checked_in', 700.00, 'Cabin C2 reservation'),
      (12, 6, '2026-03-28', '2026-04-02', 'confirmed', 175.00, NULL),
      (18, 12, '2026-03-27', '2026-03-29', 'confirmed', 44.00, 'Family tent trip'),
      (2, 15, '2026-04-01', '2026-04-08', 'confirmed', 455.00, 'Rally group member'),
      (7, 11, '2026-04-05', '2026-04-12', 'confirmed', 385.00, NULL),
      (9, 9, '2026-03-01', '2026-03-05', 'checked_out', 140.00, 'Completed stay'),
      (14, 17, '2026-03-08', '2026-03-10', 'checked_out', 40.00, 'Weekend backpacking'),
      (4, 2, '2026-02-15', '2026-02-22', 'checked_out', 350.00, NULL),
      (19, 16, '2026-02-20', '2026-02-25', 'cancelled', 600.00, 'Guest cancelled due to weather'),
      (6, 14, '2026-04-10', '2026-04-15', 'confirmed', 225.00, 'Needs pet-friendly site confirmed'),
      (13, 4, '2026-03-01', '2026-06-01', 'checked_in', 2550.00, 'Long-term seasonal stay'),
      (21, 13, '2026-04-15', '2026-04-22', 'confirmed', 840.00, 'Cabin with lake view requested')
    `);
    console.log('  - reservations seeded (18 records)');

    // Check-in/Check-out - 16 records
    await client.query(`
      INSERT INTO checkin_checkout (reservation_id, guest_id, site_id, type, timestamp, notes, processed_by) VALUES
      (1, 1, 1, 'check_in', '2026-03-15 14:30:00', 'Arrived on time, site walkthrough completed', 'Mike Chen'),
      (2, 5, 5, 'check_in', '2026-03-10 11:00:00', 'Monthly guest, familiar with park rules', 'Sarah Johnson'),
      (3, 10, 8, 'check_in', '2026-03-18 15:45:00', NULL, 'Mike Chen'),
      (5, 7, 10, 'check_in', '2026-03-20 13:15:00', 'Requested extra power cord adapter', 'Mike Chen'),
      (6, 8, 15, 'check_in', '2026-03-22 10:00:00', 'Tent camper, shown fire ring rules', 'Tom Rodriguez'),
      (7, 18, 20, 'check_in', '2026-03-19 16:00:00', 'Cabin key issued #204', 'Sarah Johnson'),
      (12, 9, 9, 'check_in', '2026-03-01 14:00:00', NULL, 'Mike Chen'),
      (12, 9, 9, 'check_out', '2026-03-05 10:30:00', 'Site inspected, all clear', 'Mike Chen'),
      (13, 17, 14, 'check_in', '2026-03-08 16:00:00', 'Backpacker, minimal setup', 'Tom Rodriguez'),
      (13, 17, 14, 'check_out', '2026-03-10 09:00:00', 'Left site clean', 'Tom Rodriguez'),
      (14, 2, 4, 'check_in', '2026-02-15 13:30:00', NULL, 'Sarah Johnson'),
      (14, 2, 4, 'check_out', '2026-02-22 11:00:00', 'Deposit returned', 'Sarah Johnson'),
      (17, 4, 13, 'check_in', '2026-03-01 10:00:00', 'Long-term resident, lease signed', 'Sarah Johnson'),
      (1, 1, 1, 'check_out', '2026-03-22 11:00:00', 'Pending', 'Mike Chen'),
      (5, 7, 10, 'check_out', '2026-03-27 10:00:00', 'Pending', 'Mike Chen'),
      (6, 8, 15, 'check_out', '2026-03-24 12:00:00', 'Pending tent check', 'Tom Rodriguez')
    `);
    console.log('  - checkin_checkout seeded (16 records)');

    // Utility Readings - 18 records
    await client.query(`
      INSERT INTO utility_readings (site_id, reading_date, electric_kwh, water_gallons, sewer_gallons, amount_due, notes) VALUES
      (1, '2026-03-01', 245.50, 1200.00, 950.00, 87.45, NULL),
      (1, '2026-03-15', 312.00, 1450.00, 1100.00, 102.30, 'Higher usage due to cold snap'),
      (5, '2026-03-01', 410.00, 1800.00, 1500.00, 135.60, 'Large rig, heavy usage'),
      (5, '2026-03-15', 380.00, 1650.00, 1350.00, 128.40, NULL),
      (8, '2026-03-15', 195.00, 980.00, 800.00, 72.15, NULL),
      (10, '2026-03-15', 150.00, 750.00, 0.00, 48.50, 'No sewer hookup at this site'),
      (3, '2026-02-15', 220.00, 1100.00, 900.00, 80.00, NULL),
      (3, '2026-03-01', 235.00, 1150.00, 920.00, 83.50, NULL),
      (4, '2026-02-15', 180.00, 900.00, 720.00, 65.40, NULL),
      (7, '2026-03-01', 200.00, 1050.00, 850.00, 76.25, NULL),
      (13, '2026-03-01', 290.00, 1350.00, 1050.00, 98.70, 'Long-term resident reading'),
      (13, '2026-03-15', 275.00, 1300.00, 1000.00, 94.50, NULL),
      (2, '2026-02-01', 165.00, 820.00, 660.00, 60.10, NULL),
      (9, '2026-03-01', 110.00, 600.00, 0.00, 38.50, 'Water/electric only site'),
      (11, '2026-03-01', 125.00, 680.00, 0.00, 42.80, NULL),
      (20, '2026-03-15', 180.00, 900.00, 700.00, 64.50, 'Cabin C2'),
      (19, '2026-03-01', 210.00, 1000.00, 800.00, 73.50, 'Cabin C1'),
      (21, '2026-03-01', 195.00, 950.00, 750.00, 68.90, 'Cabin C3')
    `);
    console.log('  - utility_readings seeded (18 records)');

    // Rates - 16 records
    await client.query(`
      INSERT INTO rates (name, rate_type, site_type, amount, start_date, end_date, is_active, notes) VALUES
      ('Full Hookup Daily - Standard', 'daily', 'full_hookup', 55.00, '2026-01-01', '2026-12-31', true, 'Standard daily rate'),
      ('Full Hookup Daily - Premium', 'daily', 'full_hookup', 65.00, '2026-01-01', '2026-12-31', true, 'Premium pull-through sites'),
      ('Full Hookup Weekly', 'weekly', 'full_hookup', 330.00, '2026-01-01', '2026-12-31', true, '1 day free equivalent'),
      ('Full Hookup Monthly', 'monthly', 'full_hookup', 1200.00, '2026-01-01', '2026-12-31', true, 'Includes basic utilities'),
      ('Water/Electric Daily', 'daily', 'water_electric', 35.00, '2026-01-01', '2026-12-31', true, NULL),
      ('Water/Electric Weekly', 'weekly', 'water_electric', 210.00, '2026-01-01', '2026-12-31', true, NULL),
      ('Tent Daily', 'daily', 'tent', 20.00, '2026-01-01', '2026-12-31', true, NULL),
      ('Tent Weekly', 'weekly', 'tent', 120.00, '2026-01-01', '2026-12-31', true, NULL),
      ('Cabin Daily - Standard', 'daily', 'cabin', 100.00, '2026-01-01', '2026-12-31', true, NULL),
      ('Cabin Daily - Deluxe', 'daily', 'cabin', 120.00, '2026-01-01', '2026-12-31', true, NULL),
      ('Summer Peak Surcharge', 'event', 'full_hookup', 15.00, '2026-06-15', '2026-08-15', true, 'Added to base rate'),
      ('Holiday Weekend Rate', 'event', NULL, 20.00, '2026-07-02', '2026-07-06', true, '4th of July premium'),
      ('Seasonal Full Hookup', 'seasonal', 'full_hookup', 3500.00, '2026-04-01', '2026-10-31', true, '7-month season'),
      ('Winter Snowbird Rate', 'monthly', 'full_hookup', 950.00, '2025-11-01', '2026-03-31', true, 'Discounted winter monthly'),
      ('Rally Group Rate', 'daily', 'full_hookup', 45.00, '2026-04-01', '2026-04-08', true, 'Group discount for rallies'),
      ('Off-Season Tent', 'daily', 'tent', 15.00, '2025-11-01', '2026-03-31', false, 'Winter tent rate - currently inactive')
    `);
    console.log('  - rates seeded (16 records)');

    // Long-term Residents - 15 records
    await client.query(`
      INSERT INTO longterm_residents (guest_id, site_id, lease_start, lease_end, monthly_rate, status, notes) VALUES
      (4, 13, '2026-03-01', '2026-06-01', 850.00, 'active', 'Seasonal resident, 3-month lease'),
      (2, 3, '2025-11-01', '2026-03-31', 950.00, 'active', 'Snowbird from Michigan'),
      (10, 8, '2026-01-01', '2026-12-31', 1200.00, 'active', 'Full-year resident'),
      (5, 5, '2026-02-01', '2026-07-31', 1100.00, 'active', '6-month lease'),
      (13, 7, '2026-04-01', '2026-09-30', 900.00, 'active', 'Summer seasonal'),
      (1, 1, '2025-10-01', '2026-04-30', 1000.00, 'active', 'Extended winter stay'),
      (7, 11, '2026-01-15', '2026-07-15', 800.00, 'active', 'Water/electric site lease'),
      (15, 2, '2025-09-01', '2026-02-28', 1050.00, 'ended', 'Lease completed'),
      (3, 4, '2025-06-01', '2025-11-30', 950.00, 'ended', 'Summer seasonal completed'),
      (9, 9, '2025-11-01', '2026-01-31', 750.00, 'ended', 'Short winter stay'),
      (14, 22, '2026-05-01', '2026-10-31', 1700.00, 'active', 'Cabin lease, pet-friendly'),
      (11, 12, '2026-03-15', '2026-06-15', 800.00, 'active', 'Spring seasonal'),
      (16, 10, '2026-02-01', '2026-05-31', 780.00, 'active', 'Water/electric quarterly'),
      (6, 4, '2026-04-01', '2026-08-31', 1100.00, 'active', 'First long-term stay'),
      (8, 14, '2026-05-15', '2026-08-15', 450.00, 'active', 'Tent seasonal rate')
    `);
    console.log('  - longterm_residents seeded (15 records)');

    // Amenities - 16 records
    await client.query(`
      INSERT INTO amenities (name, type, capacity, status, rate_per_hour, description) VALUES
      ('Main Swimming Pool', 'pool', 50, 'open', 0.00, 'Heated pool open 8am-9pm, lifeguard on duty'),
      ('Hot Tub / Spa', 'pool', 8, 'open', 0.00, 'Adults only after 8pm'),
      ('Clubhouse', 'recreation', 100, 'open', 25.00, 'Available for private events, full kitchen'),
      ('Fitness Center', 'fitness', 20, 'open', 0.00, 'Treadmills, weights, and yoga mats'),
      ('Laundry Room A', 'laundry', 10, 'open', 0.00, '5 washers, 5 dryers, coin-operated'),
      ('Laundry Room B', 'laundry', 6, 'open', 0.00, '3 washers, 3 dryers, near tent area'),
      ('Dog Park', 'pet', 30, 'open', 0.00, 'Fenced area with agility equipment'),
      ('Playground', 'recreation', 25, 'open', 0.00, 'Ages 3-12, rubber mulch surface'),
      ('Basketball Court', 'sport', 10, 'open', 0.00, 'Full court with lighting'),
      ('Pickleball Courts', 'sport', 8, 'open', 5.00, '2 courts, equipment rental available'),
      ('Fishing Dock', 'recreation', 15, 'open', 0.00, 'Catch and release, license required'),
      ('Boat Launch', 'recreation', 4, 'open', 10.00, 'Small watercraft only'),
      ('Game Room', 'recreation', 20, 'open', 0.00, 'Pool table, foosball, arcade games'),
      ('Pavilion A', 'event', 60, 'open', 50.00, 'Covered pavilion with picnic tables and grill'),
      ('Pavilion B', 'event', 30, 'open', 35.00, 'Smaller covered area near lake'),
      ('Bathhouse - Main', 'facility', 12, 'maintenance', 0.00, 'Showers and restrooms, tile repair in progress')
    `);
    console.log('  - amenities seeded (16 records)');

    // Amenity Bookings - 16 records
    await client.query(`
      INSERT INTO amenity_bookings (amenity_id, guest_id, booking_date, start_time, end_time, status, notes) VALUES
      (3, 1, '2026-03-25', '18:00', '21:00', 'confirmed', 'Birthday party for family'),
      (3, 15, '2026-04-05', '10:00', '16:00', 'confirmed', 'Rally group meeting'),
      (10, 5, '2026-03-23', '09:00', '11:00', 'confirmed', NULL),
      (10, 9, '2026-03-23', '14:00', '16:00', 'confirmed', NULL),
      (12, 7, '2026-03-24', '08:00', '10:00', 'confirmed', 'Kayak launch'),
      (14, 12, '2026-03-28', '11:00', '15:00', 'confirmed', 'Family BBQ'),
      (15, 8, '2026-03-22', '17:00', '20:00', 'confirmed', 'Sunset dinner by the lake'),
      (10, 11, '2026-03-25', '10:00', '12:00', 'confirmed', 'Pickleball tournament'),
      (3, 18, '2026-03-30', '14:00', '17:00', 'confirmed', 'Cabin guest event'),
      (12, 1, '2026-03-26', '06:00', '08:00', 'confirmed', 'Morning fishing trip launch'),
      (14, 5, '2026-04-02', '12:00', '18:00', 'confirmed', 'Group cookout'),
      (10, 3, '2026-03-29', '15:00', '17:00', 'cancelled', 'Guest cancelled'),
      (3, 13, '2026-04-15', '09:00', '12:00', 'confirmed', 'Workshop event'),
      (15, 6, '2026-04-03', '16:00', '19:00', 'confirmed', NULL),
      (12, 16, '2026-03-27', '07:00', '09:00', 'confirmed', 'Canoe rental'),
      (14, 4, '2026-03-31', '11:00', '14:00', 'confirmed', 'Long-term resident gathering')
    `);
    console.log('  - amenity_bookings seeded (16 records)');

    // Store Items - 18 records
    await client.query(`
      INSERT INTO store_items (name, category, price, quantity, sku, description) VALUES
      ('Firewood Bundle', 'camping', 8.99, 150, 'CAMP-FW-001', 'Seasoned oak firewood bundle'),
      ('Ice Bag (10lb)', 'essentials', 4.99, 200, 'ESS-ICE-001', 'Bagged ice for coolers'),
      ('RV Sewer Hose', 'rv_supplies', 29.99, 15, 'RV-SEW-001', '20ft heavy-duty sewer hose'),
      ('30A to 50A Adapter', 'rv_supplies', 24.99, 10, 'RV-ADP-001', 'Electrical adapter 30A to 50A'),
      ('Water Pressure Regulator', 'rv_supplies', 14.99, 20, 'RV-WPR-001', 'Adjustable brass regulator'),
      ('S''mores Kit', 'food', 6.99, 50, 'FOOD-SM-001', 'Marshmallows, chocolate, graham crackers'),
      ('Hot Dog Pack', 'food', 5.99, 40, 'FOOD-HD-001', '8-count beef franks'),
      ('Bug Spray', 'essentials', 7.99, 30, 'ESS-BUG-001', 'DEET-free insect repellent'),
      ('Sunscreen SPF 50', 'essentials', 9.99, 25, 'ESS-SUN-001', 'Water-resistant, 6oz'),
      ('Camping Chair', 'camping', 34.99, 12, 'CAMP-CHR-001', 'Folding chair with cup holder'),
      ('LED Lantern', 'camping', 19.99, 18, 'CAMP-LAN-001', 'Battery-powered LED lantern'),
      ('RV Toilet Paper (4pk)', 'rv_supplies', 8.99, 45, 'RV-TP-001', 'Septic-safe toilet paper'),
      ('Propane Tank Exchange', 'propane', 24.99, 30, 'PROP-EX-001', '20lb tank exchange'),
      ('Fishing Bait Cup', 'recreation', 3.99, 60, 'REC-BAIT-001', 'Live nightcrawlers'),
      ('Park T-Shirt', 'merchandise', 22.99, 35, 'MERCH-TS-001', 'Cotton tee with park logo'),
      ('Park Coffee Mug', 'merchandise', 12.99, 40, 'MERCH-MG-001', 'Ceramic mug with park logo'),
      ('First Aid Kit', 'essentials', 15.99, 20, 'ESS-FA-001', 'Basic first aid supplies'),
      ('Charcoal Bag (10lb)', 'camping', 11.99, 35, 'CAMP-CHR-002', 'Premium charcoal briquettes')
    `);
    console.log('  - store_items seeded (18 records)');

    // Store Transactions - 16 records
    await client.query(`
      INSERT INTO store_transactions (guest_id, items, total, payment_method, notes) VALUES
      (1, '[{"name":"Firewood Bundle","qty":2,"price":8.99},{"name":"Ice Bag","qty":1,"price":4.99}]', 22.97, 'credit_card', NULL),
      (5, '[{"name":"RV Sewer Hose","qty":1,"price":29.99}]', 29.99, 'credit_card', NULL),
      (8, '[{"name":"S''mores Kit","qty":2,"price":6.99},{"name":"Firewood Bundle","qty":3,"price":8.99}]', 40.95, 'cash', NULL),
      (12, '[{"name":"Bug Spray","qty":2,"price":7.99},{"name":"Sunscreen SPF 50","qty":1,"price":9.99}]', 25.97, 'credit_card', NULL),
      (7, '[{"name":"30A to 50A Adapter","qty":1,"price":24.99},{"name":"Water Pressure Regulator","qty":1,"price":14.99}]', 39.98, 'credit_card', NULL),
      (3, '[{"name":"Ice Bag","qty":2,"price":4.99},{"name":"Hot Dog Pack","qty":1,"price":5.99}]', 15.97, 'cash', NULL),
      (18, '[{"name":"Park T-Shirt","qty":2,"price":22.99},{"name":"Park Coffee Mug","qty":1,"price":12.99}]', 58.97, 'credit_card', 'Souvenirs'),
      (9, '[{"name":"Fishing Bait Cup","qty":3,"price":3.99}]', 11.97, 'cash', NULL),
      (11, '[{"name":"RV Toilet Paper (4pk)","qty":2,"price":8.99},{"name":"Ice Bag","qty":1,"price":4.99}]', 22.97, 'credit_card', NULL),
      (15, '[{"name":"Charcoal Bag","qty":1,"price":11.99},{"name":"Hot Dog Pack","qty":2,"price":5.99}]', 23.97, 'cash', 'Rally group purchase'),
      (6, '[{"name":"Camping Chair","qty":1,"price":34.99},{"name":"LED Lantern","qty":1,"price":19.99}]', 54.98, 'credit_card', 'First-time camper essentials'),
      (4, '[{"name":"Ice Bag","qty":3,"price":4.99}]', 14.97, 'cash', NULL),
      (10, '[{"name":"Propane Tank Exchange","qty":1,"price":24.99}]', 24.99, 'credit_card', NULL),
      (2, '[{"name":"First Aid Kit","qty":1,"price":15.99},{"name":"Bug Spray","qty":1,"price":7.99}]', 23.98, 'credit_card', NULL),
      (14, '[{"name":"Firewood Bundle","qty":4,"price":8.99}]', 35.96, 'cash', 'Campfire night'),
      (17, '[{"name":"S''mores Kit","qty":1,"price":6.99},{"name":"Firewood Bundle","qty":1,"price":8.99}]', 15.98, 'cash', NULL)
    `);
    console.log('  - store_transactions seeded (16 records)');

    // Maintenance Orders - 16 records
    await client.query(`
      INSERT INTO maintenance_orders (site_id, title, description, priority, status, assigned_to, due_date, completed_date, cost, notes) VALUES
      (6, 'Water Hookup Repair', 'Leaking water connection at site A6, needs new valve', 'high', 'in_progress', 'Tom Rodriguez', '2026-03-25', NULL, 150.00, 'Parts ordered'),
      (22, 'Cabin Roof Repair', 'Several shingles damaged from wind storm on cabin C4', 'high', 'open', 'External Contractor', '2026-04-01', NULL, 2500.00, 'Awaiting contractor estimate'),
      (1, 'Electrical Outlet Replacement', 'Outlet showing signs of corrosion at site A1', 'medium', 'completed', 'Tom Rodriguez', '2026-03-15', '2026-03-14', 75.00, NULL),
      (NULL, 'Pool Pump Maintenance', 'Quarterly pool pump inspection and filter cleaning', 'medium', 'completed', 'Tom Rodriguez', '2026-03-10', '2026-03-10', 200.00, 'Filter replaced'),
      (15, 'Fire Ring Replacement', 'Fire ring at tent site T2 rusted through', 'low', 'open', 'Tom Rodriguez', '2026-04-15', NULL, 85.00, NULL),
      (NULL, 'Bathhouse Tile Repair', 'Cracked tiles in main bathhouse shower area', 'high', 'in_progress', 'External Contractor', '2026-03-28', NULL, 1200.00, 'Tile removal started'),
      (5, 'Tree Trimming', 'Low-hanging branches near site A5 power lines', 'urgent', 'completed', 'External Contractor', '2026-03-12', '2026-03-12', 450.00, 'Safety hazard resolved'),
      (NULL, 'Wi-Fi Router Upgrade', 'Upgrade access point near sites B1-B5', 'medium', 'open', 'IT Support', '2026-04-10', NULL, 800.00, NULL),
      (10, 'Gravel Pad Resurfacing', 'Site B2 pad has potholes from heavy rain', 'medium', 'open', 'Tom Rodriguez', '2026-04-05', NULL, 300.00, '5 tons of gravel needed'),
      (NULL, 'Dump Station Pump Service', 'Annual pump-out service for dump station', 'medium', 'completed', 'Waste Services Inc.', '2026-03-05', '2026-03-05', 350.00, NULL),
      (19, 'Cabin Deck Staining', 'Deck on Cabin C1 needs re-staining', 'low', 'open', 'Tom Rodriguez', '2026-05-01', NULL, 200.00, 'Weather-permitting'),
      (NULL, 'Security Camera Install', 'New camera at east gate entrance', 'medium', 'in_progress', 'IT Support', '2026-03-30', NULL, 600.00, 'Camera purchased, mounting pending'),
      (3, 'Sewer Line Inspection', 'Annual sewer line scope at site A3', 'low', 'open', 'Plumbing Pros', '2026-04-20', NULL, 175.00, NULL),
      (NULL, 'Playground Equipment Safety Check', 'Monthly playground inspection and tightening', 'medium', 'completed', 'Tom Rodriguez', '2026-03-01', '2026-03-01', 0.00, 'All equipment satisfactory'),
      (8, 'Picnic Table Replacement', 'Rotted picnic table at site A8', 'low', 'open', 'Tom Rodriguez', '2026-04-15', NULL, 250.00, NULL),
      (NULL, 'Road Pothole Repair', 'Three potholes on main loop road', 'high', 'in_progress', 'Tom Rodriguez', '2026-03-26', NULL, 400.00, 'Cold patch applied, needs hot patch')
    `);
    console.log('  - maintenance_orders seeded (16 records)');

    // Loyalty Rewards - 18 records
    await client.query(`
      INSERT INTO loyalty_rewards (guest_id, points, action, description) VALUES
      (1, 250, 'earned', 'Weekly stay at full hookup site'),
      (1, 100, 'earned', 'Store purchase over $50'),
      (5, 500, 'earned', 'Monthly stay booking'),
      (5, 200, 'earned', 'Referral bonus - referred guest 6'),
      (5, -100, 'redeemed', 'Free night coupon'),
      (10, 300, 'earned', 'Weekly stay at premium site'),
      (10, -200, 'redeemed', 'Store credit $20'),
      (2, 350, 'earned', 'Snowbird monthly stays'),
      (4, 250, 'earned', 'Long-term lease bonus'),
      (13, 400, 'earned', 'Seasonal booking bonus'),
      (15, 200, 'earned', 'Group rally organizer bonus'),
      (7, 150, 'earned', 'Weekly stay'),
      (3, 100, 'earned', 'First-time booking bonus'),
      (9, 175, 'earned', 'Multi-day stay'),
      (11, 100, 'earned', 'Weekly stay'),
      (14, 75, 'earned', 'Weekend stay'),
      (12, 50, 'earned', 'Weekend tent camping'),
      (18, -150, 'redeemed', 'Cabin upgrade discount')
    `);
    console.log('  - loyalty_rewards seeded (18 records)');

    // Revenue Records - 18 records
    await client.query(`
      INSERT INTO revenue_records (source, site_id, amount, revenue_date, category, notes) VALUES
      ('Site Rental', 1, 455.00, '2026-03-15', 'accommodation', 'Weekly rental A1'),
      ('Site Rental', 5, 1500.00, '2026-03-10', 'accommodation', 'Monthly rental A5'),
      ('Site Rental', 8, 455.00, '2026-03-18', 'accommodation', 'Weekly rental A8'),
      ('Site Rental', 10, 245.00, '2026-03-20', 'accommodation', 'Weekly rental B2'),
      ('Site Rental', 15, 40.00, '2026-03-22', 'accommodation', 'Weekend tent T2'),
      ('Cabin Rental', 20, 700.00, '2026-03-19', 'accommodation', 'Cabin C2 weekly'),
      ('Store Sales', NULL, 245.50, '2026-03-20', 'retail', 'Daily store total'),
      ('Store Sales', NULL, 312.75, '2026-03-21', 'retail', 'Daily store total'),
      ('Store Sales', NULL, 189.20, '2026-03-22', 'retail', 'Daily store total'),
      ('Propane Sales', NULL, 187.50, '2026-03-20', 'fuel', '5 tank fills'),
      ('Propane Sales', NULL, 112.50, '2026-03-22', 'fuel', '3 tank fills'),
      ('Amenity Booking', NULL, 75.00, '2026-03-25', 'amenities', 'Clubhouse rental'),
      ('Amenity Booking', NULL, 50.00, '2026-03-28', 'amenities', 'Pavilion A rental'),
      ('Utility Charges', 1, 102.30, '2026-03-15', 'utilities', 'Site A1 utilities'),
      ('Utility Charges', 5, 128.40, '2026-03-15', 'utilities', 'Site A5 utilities'),
      ('Firewood Sales', NULL, 143.84, '2026-03-22', 'retail', 'Weekend firewood sales'),
      ('Laundry', NULL, 45.00, '2026-03-22', 'amenities', 'Laundry machine revenue'),
      ('Long-term Lease', 13, 850.00, '2026-03-01', 'accommodation', 'Monthly lease payment')
    `);
    console.log('  - revenue_records seeded (18 records)');

    // Security Logs - 18 records
    await client.query(`
      INSERT INTO security_logs (gate_name, guest_id, access_code, action, vehicle_info, notes, timestamp) VALUES
      ('Main Gate', 1, '4521', 'entry', 'Class A Motorhome, TX-ABC1234', NULL, '2026-03-15 14:15:00'),
      ('Main Gate', 5, '7834', 'entry', 'Class A Motorhome + Tow, CO-JKL7890', NULL, '2026-03-10 10:45:00'),
      ('Main Gate', 10, '9912', 'entry', 'Class A Motorhome, NV-VWX3456', NULL, '2026-03-18 15:30:00'),
      ('Main Gate', 7, '3356', 'entry', 'Truck + Fifth Wheel, OR-PQR5678', NULL, '2026-03-20 13:00:00'),
      ('Main Gate', 8, NULL, 'entry', 'Sedan, unknown plate', 'Tent camper, no code assigned yet', '2026-03-22 09:45:00'),
      ('Back Gate', 18, '5501', 'entry', 'SUV, no plate recorded', 'Cabin guest', '2026-03-19 15:50:00'),
      ('Main Gate', 9, '2278', 'exit', 'Class B Van, WA-STU9012', 'Checked out', '2026-03-05 10:45:00'),
      ('Main Gate', 2, '6645', 'exit', 'Truck + Fifth Wheel, CA-XYZ5678', NULL, '2026-02-22 11:15:00'),
      ('Main Gate', NULL, NULL, 'denied', 'Unknown white sedan', 'No code, turned away', '2026-03-21 23:30:00'),
      ('Back Gate', NULL, '0000', 'denied', 'Motorcycle', 'Invalid code attempted 3 times', '2026-03-19 02:15:00'),
      ('Main Gate', 1, '4521', 'exit', 'Sedan (tow vehicle only), TX plates', 'Day trip to town', '2026-03-17 09:00:00'),
      ('Main Gate', 1, '4521', 'entry', 'Sedan (tow vehicle), TX plates', 'Returned from town', '2026-03-17 17:30:00'),
      ('Main Gate', 5, '7834', 'exit', 'Tow vehicle only, CO plates', NULL, '2026-03-15 08:00:00'),
      ('Main Gate', 5, '7834', 'entry', 'Tow vehicle only, CO plates', 'Grocery run', '2026-03-15 11:30:00'),
      ('Main Gate', 12, NULL, 'entry', 'Minivan with tent gear', 'Weekend family campers', '2026-03-27 16:00:00'),
      ('Back Gate', 4, '8890', 'entry', 'Class C, AZ-GHI3456', 'Long-term resident', '2026-03-01 10:00:00'),
      ('Main Gate', 17, NULL, 'entry', 'Hatchback, WY plates', 'Backpacker', '2026-03-08 15:45:00'),
      ('Main Gate', 17, NULL, 'exit', 'Hatchback, WY plates', NULL, '2026-03-10 09:15:00')
    `);
    console.log('  - security_logs seeded (18 records)');

    // Mail/Packages - 16 records
    await client.query(`
      INSERT INTO mail_packages (guest_id, type, sender, tracking_number, status, received_date, picked_up_date, notes) VALUES
      (1, 'package', 'Amazon', '1Z999AA10123456784', 'picked_up', '2026-03-16 10:00:00', '2026-03-16 14:30:00', NULL),
      (5, 'package', 'Camping World', '9400111899223100001', 'notified', '2026-03-20 09:00:00', NULL, 'Large box - RV parts'),
      (5, 'mail', 'USPS General', NULL, 'picked_up', '2026-03-18 11:00:00', '2026-03-18 16:00:00', 'Regular mail forwarding'),
      (10, 'package', 'Amazon', '1Z999AA10123456785', 'received', '2026-03-22 10:30:00', NULL, NULL),
      (4, 'certified', 'IRS', '7196901234567890123456', 'notified', '2026-03-20 09:30:00', NULL, 'Certified letter, signature required'),
      (2, 'mail', 'Bank of America', NULL, 'picked_up', '2026-03-10 11:00:00', '2026-03-10 15:00:00', NULL),
      (13, 'package', 'Walmart', '9261290100130435082901', 'picked_up', '2026-03-15 14:00:00', '2026-03-16 09:00:00', NULL),
      (7, 'package', 'FedEx Sender', '794644790132', 'notified', '2026-03-21 08:00:00', NULL, 'Heavy package, 25 lbs'),
      (1, 'mail', 'State Farm Insurance', NULL, 'picked_up', '2026-03-19 10:00:00', '2026-03-19 12:30:00', 'Insurance documents'),
      (18, 'package', 'Chewy.com', '1Z999BB20234567891', 'received', '2026-03-22 11:00:00', NULL, 'Pet supplies'),
      (15, 'mail', 'Good Sam Club', NULL, 'picked_up', '2026-03-12 09:00:00', '2026-03-12 17:00:00', 'Membership renewal'),
      (4, 'package', 'Home Depot', '9400111899223100002', 'returned', '2026-02-15 10:00:00', NULL, 'Guest was not in park, returned to sender'),
      (9, 'mail', 'USPS General', NULL, 'picked_up', '2026-03-03 11:00:00', '2026-03-03 14:00:00', NULL),
      (11, 'package', 'Amazon', '1Z999AA10123456786', 'notified', '2026-03-22 09:00:00', NULL, 'Arriving today'),
      (3, 'certified', 'DMV', '7196901234567890123457', 'notified', '2026-03-21 10:00:00', NULL, 'Vehicle registration renewal'),
      (6, 'package', 'REI', '1Z999CC30345678901', 'received', '2026-03-22 14:00:00', NULL, 'Camping equipment')
    `);
    console.log('  - mail_packages seeded (16 records)');

    // Propane Sales - 16 records
    await client.query(`
      INSERT INTO propane_sales (guest_id, gallons, price_per_gallon, total, tank_size, sale_date, notes) VALUES
      (1, 4.50, 3.99, 17.96, '20lb', '2026-03-16 10:00:00', NULL),
      (5, 7.80, 3.99, 31.12, '30lb', '2026-03-12 14:00:00', 'Large tank fill'),
      (7, 4.20, 3.99, 16.76, '20lb', '2026-03-21 09:00:00', NULL),
      (10, 4.50, 3.99, 17.96, '20lb', '2026-03-19 11:00:00', NULL),
      (3, 3.80, 3.99, 15.16, '20lb', '2026-03-22 15:00:00', 'Partially empty tank'),
      (15, 4.50, 3.99, 17.96, '20lb', '2026-03-20 10:00:00', NULL),
      (2, 7.50, 3.99, 29.93, '30lb', '2026-03-08 13:00:00', NULL),
      (11, 4.50, 3.99, 17.96, '20lb', '2026-03-22 09:00:00', NULL),
      (4, 4.50, 3.99, 17.96, '20lb', '2026-03-15 16:00:00', NULL),
      (13, 7.80, 3.99, 31.12, '30lb', '2026-03-10 11:00:00', 'Seasonal resident'),
      (14, 4.10, 3.99, 16.36, '20lb', '2026-03-18 14:00:00', NULL),
      (1, 4.50, 3.99, 17.96, '20lb', '2026-03-21 10:00:00', 'Second fill this week'),
      (9, 3.50, 3.99, 13.97, '20lb', '2026-03-03 09:00:00', NULL),
      (6, 4.50, 3.99, 17.96, '20lb', '2026-03-22 11:00:00', 'New camper'),
      (18, 2.00, 3.99, 7.98, '11lb', '2026-03-20 15:00:00', 'Small cabin grill tank'),
      (8, 1.50, 3.99, 5.99, '11lb', '2026-03-22 17:00:00', 'Camp stove refill')
    `);
    console.log('  - propane_sales seeded (16 records)');

    // Firewood Inventory - 15 records
    await client.query(`
      INSERT INTO firewood_inventory (wood_type, quantity_bundles, price_per_bundle, supplier, last_restocked, notes) VALUES
      ('Oak', 120, 8.99, 'Johnson Timber Co.', '2026-03-15', 'Premium hardwood, slow burning'),
      ('Hickory', 80, 9.99, 'Johnson Timber Co.', '2026-03-15', 'Great for cooking'),
      ('Pine', 150, 5.99, 'Mountain Wood Supply', '2026-03-18', 'Good fire starter, burns fast'),
      ('Maple', 60, 8.49, 'Johnson Timber Co.', '2026-03-10', 'Sweet aroma when burning'),
      ('Birch', 45, 7.99, 'Mountain Wood Supply', '2026-03-12', 'Easy to split, good kindling bark'),
      ('Cherry', 30, 10.99, 'Artisan Firewood LLC', '2026-03-08', 'Premium, pleasant smell'),
      ('Mesquite', 25, 12.99, 'Southwest Wood Co.', '2026-03-01', 'Excellent for grilling'),
      ('Cedar', 40, 6.99, 'Mountain Wood Supply', '2026-03-18', 'Natural insect repellent, aromatic'),
      ('Ash', 70, 7.49, 'Johnson Timber Co.', '2026-03-15', 'Burns well even when green'),
      ('Mixed Hardwood', 200, 6.49, 'Bulk Wood Distributors', '2026-03-20', 'Economy bundle, mixed species'),
      ('Fatwood Starter', 100, 4.99, 'Mountain Wood Supply', '2026-03-18', 'Resin-rich fire starters'),
      ('Pecan', 35, 11.49, 'Southern Wood Supply', '2026-03-05', 'Nutty aroma, great for smoking'),
      ('Apple', 20, 13.99, 'Artisan Firewood LLC', '2026-02-28', 'Premium cooking wood'),
      ('Compressed Logs', 90, 5.49, 'EcoFire Products', '2026-03-20', 'Compressed sawdust logs, long burn'),
      ('Kindling Pack', 150, 3.49, 'Mountain Wood Supply', '2026-03-18', 'Small split wood for starting fires')
    `);
    console.log('  - firewood_inventory seeded (15 records)');

    // Dump Station Logs - 16 records
    await client.query(`
      INSERT INTO dump_station_logs (site_id, guest_id, station_number, usage_date, duration_minutes, notes) VALUES
      (1, 1, 1, '2026-03-18 08:00:00', 15, NULL),
      (5, 5, 1, '2026-03-14 09:30:00', 20, 'Large tank'),
      (5, 5, 2, '2026-03-21 08:00:00', 18, NULL),
      (10, 7, 1, '2026-03-22 07:30:00', 12, NULL),
      (8, 10, 2, '2026-03-20 10:00:00', 15, NULL),
      (9, 9, 1, '2026-03-04 09:00:00', 10, 'Quick dump before checkout'),
      (4, 2, 2, '2026-02-20 08:30:00', 14, NULL),
      (3, 3, 1, '2026-03-22 11:00:00', 16, NULL),
      (1, 1, 2, '2026-03-21 07:00:00', 15, 'Second dump this week'),
      (13, 4, 1, '2026-03-15 09:00:00', 12, 'Long-term resident'),
      (13, 4, 2, '2026-03-22 08:00:00', 12, NULL),
      (11, 11, 1, '2026-03-22 10:30:00', 10, NULL),
      (7, 15, 2, '2026-03-20 14:00:00', 18, 'Rally group member'),
      (12, 6, 1, '2026-03-22 13:00:00', 8, 'Small tank'),
      (2, 14, 1, '2026-03-19 09:00:00', 14, NULL),
      (5, 5, 1, '2026-03-07 08:30:00', 20, 'Weekly dump')
    `);
    console.log('  - dump_station_logs seeded (16 records)');

    console.log('\nSeed completed successfully!');
    console.log('Admin login: admin@rvpark.com / admin123');
  } catch (err) {
    console.error('Seed error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
