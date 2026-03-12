// scripts/create-agent-system.js
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(process.cwd(), 'bus_booking.db');
const db = new Database(dbPath);

console.log('🔧 Creating agent system tables...');

try {
    // 1. Create agents table
    db.exec(`
        CREATE TABLE IF NOT EXISTS agents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_name TEXT NOT NULL,
            business_type TEXT NOT NULL CHECK(business_type IN (
                'retail_chain',     -- Shoprite, Pick n Pay
                'station_kiosk',    -- Bus station booth
                'travel_agency',    -- Travel agency
                'independent'       -- Individual agent
            )),
            registration_number TEXT UNIQUE,  -- Business registration
            tax_id TEXT,                       -- Tax identification
            
            -- Contact information
            contact_name TEXT NOT NULL,
            contact_phone TEXT NOT NULL,
            contact_email TEXT UNIQUE NOT NULL,
            alternative_phone TEXT,
            
            -- Location
            physical_address TEXT NOT NULL,
            city TEXT NOT NULL,
            province TEXT NOT NULL,
            
            -- Login credentials
            password TEXT NOT NULL,
            
            -- Commission structure
            commission_rate REAL DEFAULT 5.0,  -- Percentage commission
            commission_type TEXT DEFAULT 'percentage' CHECK(commission_type IN ('percentage', 'fixed')),
            fixed_commission_amount REAL DEFAULT 0,
            
            -- Verification
            verified INTEGER DEFAULT 0,
            verified_at DATETIME,
            verified_by INTEGER,
            
            -- Status
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'suspended', 'rejected')),
            
            -- Documents
            business_certificate_url TEXT,
            tax_clearance_url TEXT,
            id_document_url TEXT,
            
            -- Settings
            can_sell_all_companies INTEGER DEFAULT 1,
            restricted_companies TEXT,  -- JSON array of company IDs if restricted
            
            -- Timestamps
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            
            FOREIGN KEY (verified_by) REFERENCES users(id)
        )
    `);
    console.log('✅ agents table created');

    // 2. Create agent_locations table (for agents with multiple outlets)
    db.exec(`
        CREATE TABLE IF NOT EXISTS agent_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id INTEGER NOT NULL,
            location_name TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            phone TEXT,
            is_main INTEGER DEFAULT 0,
            latitude REAL,
            longitude REAL,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
        )
    `);
    console.log('✅ agent_locations table created');

    // 3. Create agent_sessions table for tracking
    db.exec(`
        CREATE TABLE IF NOT EXISTS agent_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id INTEGER NOT NULL,
            location_id INTEGER,
            device_id TEXT,
            ip_address TEXT,
            user_agent TEXT,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            ended_at DATETIME,
            status TEXT DEFAULT 'active',
            FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
            FOREIGN KEY (location_id) REFERENCES agent_locations(id)
        )
    `);
    console.log('✅ agent_sessions table created');

    // 4. Create agent_commission_logs table
    db.exec(`
        CREATE TABLE IF NOT EXISTS agent_commission_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id INTEGER NOT NULL,
            booking_id INTEGER NOT NULL,
            booking_reference TEXT NOT NULL,
            amount REAL NOT NULL,
            commission_rate REAL NOT NULL,
            commission_amount REAL NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled')),
            paid_at DATETIME,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agents(id),
            FOREIGN KEY (booking_id) REFERENCES bookings(id)
        )
    `);
    console.log('✅ agent_commission_logs table created');

    // 5. Update bookings table to include agent_id
    try {
        db.exec(`ALTER TABLE bookings ADD COLUMN agent_id INTEGER`);
        db.exec(`ALTER TABLE bookings ADD COLUMN agent_location_id INTEGER`);
        db.exec(`ALTER TABLE bookings ADD COLUMN agent_commission REAL DEFAULT 0`);
        db.exec(`ALTER TABLE bookings ADD COLUMN agent_commission_paid INTEGER DEFAULT 0`);
        console.log('✅ updated bookings table with agent fields');
    } catch (e) {
        console.log('ℹ️ agent fields in bookings already exist');
    }

    // 6. Create indexes
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(contact_email);
        CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
        CREATE INDEX IF NOT EXISTS idx_agents_city ON agents(city);
        CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent ON agent_sessions(agent_id);
        CREATE INDEX IF NOT EXISTS idx_commission_agent ON agent_commission_logs(agent_id, status);
        CREATE INDEX IF NOT EXISTS idx_commission_booking ON agent_commission_logs(booking_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_agent ON bookings(agent_id);
    `);
    console.log('✅ indexes created');

    // 7. Add agent role to audit_logs constraint
    console.log('\n📝 Note: Remember to update audit_logs user_type CHECK constraint to include "agent"');

    console.log('\n✅ Agent system tables created successfully!');

} catch (error) {
    console.error('❌ Error creating tables:', error);
} finally {
    db.close();
}