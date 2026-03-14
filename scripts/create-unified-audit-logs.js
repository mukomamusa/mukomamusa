// scripts/create-unified-audit-logs.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'bus_booking.db');
const db = new Database(dbPath);

console.log('📦 Creating unified audit_logs table...');

try {
    // Drop old tables if they exist
    db.exec(`DROP TABLE IF EXISTS driver_audit_logs`);
    db.exec(`DROP TABLE IF EXISTS audit_logs`);

    // Create unified audit_logs table with polymorphic association
    db.exec(`
        CREATE TABLE audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            
            -- Polymorphic actor reference (who did it)
            actor_id INTEGER NOT NULL,
            actor_type TEXT NOT NULL CHECK(actor_type IN ('user', 'driver', 'agent', 'system')),
            actor_email TEXT NOT NULL,
            actor_name TEXT NOT NULL,
            
            -- For users table reference (only populated if actor_type = 'user')
            user_id INTEGER,
            
            -- For drivers table reference (only populated if actor_type = 'driver')
            driver_id INTEGER,
            
            -- For agents table reference (only populated if actor_type = 'agent')
            agent_id INTEGER,
            
            -- What action was performed
            action TEXT NOT NULL,
            action_category TEXT NOT NULL CHECK(action_category IN (
                'auth', 'profile', 'booking', 'payment', 'route', 
                'bus', 'driver', 'review', 'admin', 'system', 'agent'
            )),
            
            -- Affected entity (what was changed)
            entity_type TEXT,
            entity_id INTEGER,
            
            -- Before/after values (for changes)
            old_value TEXT,
            new_value TEXT,
            
            -- Context
            ip_address TEXT,
            user_agent TEXT,
            metadata TEXT,
            
            -- Result
            status TEXT DEFAULT 'success' CHECK(status IN ('success', 'failure', 'pending')),
            error_message TEXT,
            
            -- Timing
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            -- Foreign key constraints (only one will be non-null based on actor_type)
            -- For 'system' type, all FK columns are NULL
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
            FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL,
            
            -- Ensure exactly one reference is set based on actor_type (system allows all null)
            CHECK (
                (actor_type = 'user' AND user_id IS NOT NULL AND driver_id IS NULL AND agent_id IS NULL) OR
                (actor_type = 'driver' AND driver_id IS NOT NULL AND user_id IS NULL AND agent_id IS NULL) OR
                (actor_type = 'agent' AND agent_id IS NOT NULL AND user_id IS NULL AND driver_id IS NULL) OR
                (actor_type = 'system' AND user_id IS NULL AND driver_id IS NULL AND agent_id IS NULL)
            )
        )
    `);

    console.log('✅ audit_logs table created successfully');

    // Create indexes for performance (after table is created)
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_type, actor_id);
        CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id) WHERE user_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_audit_driver ON audit_logs(driver_id) WHERE driver_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_audit_agent ON audit_logs(agent_id) WHERE agent_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_category, action);
        CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs(status);
    `);

    console.log('✅ indexes created successfully');

    // Verify table structure
    const tableInfo = db.prepare("PRAGMA table_info(audit_logs)").all();
    console.log('\n📋 Table structure:');
    console.table(tableInfo.map(col => ({
        column: col.name,
        type: col.type,
        notnull: col.notnull ? 'YES' : 'NO',
        pk: col.pk ? 'YES' : 'NO'
    })));

    // Count records (will be 0)
    const count = db.prepare("SELECT COUNT(*) as count FROM audit_logs").get();
    console.log(`\n📊 Total records: ${count.count}`);

} catch (error) {
    console.error('❌ Error creating table:', error);
} finally {
    db.close();
}