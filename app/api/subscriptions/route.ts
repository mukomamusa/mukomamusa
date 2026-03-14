import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET subscription status for company's buses
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get subscription settings (backward compatible)
    let pricePerBus = 500;
    let trialDays = 14;
    try {
      const settings = db.prepare(`
        SELECT setting_key, setting_value FROM platform_settings 
        WHERE setting_key IN ('subscription_price_per_bus', 'subscription_trial_days')
      `).all() as any[];

      const settingsMap: any = {};
      settings.forEach(s => { settingsMap[s.setting_key] = s.setting_value; });

      pricePerBus = parseFloat(settingsMap.subscription_price_per_bus || '500');
      trialDays = parseInt(settingsMap.subscription_trial_days || '14');
    } catch (e) { /* Table doesn't exist yet */ }

    if (decoded.user_type === 'admin') {
      // Admin gets all subscription data
      let allBuses: any[] = [];
      try {
        allBuses = db.prepare(`
          SELECT b.*, u.company_name,
            CASE 
              WHEN b.subscription_status = 'trial' AND b.trial_end_date > datetime('now') THEN 'trial'
              WHEN b.subscription_status = 'active' AND b.subscription_end_date > datetime('now') THEN 'active'
              WHEN b.subscription_status = 'trial' AND b.trial_end_date <= datetime('now') THEN 'expired'
              WHEN b.subscription_status = 'active' AND b.subscription_end_date <= datetime('now') THEN 'expired'
              ELSE COALESCE(b.subscription_status, 'expired')
            END as current_status
          FROM buses b
          JOIN users u ON b.company_id = u.id
          ORDER BY b.company_id, b.id
        `).all();
      } catch (e) {
        // Fallback: all buses are considered active (no subscription columns)
        allBuses = db.prepare(`
          SELECT b.*, u.company_name, 'active' as current_status
          FROM buses b
          JOIN users u ON b.company_id = u.id
          ORDER BY b.company_id, b.id
        `).all();
      }

      // Get subscription revenue and status counts (backward compatible)
      let subscriptionRevenue = { totalPaid: 0, paidCount: 0, pendingCount: 0 };
      let statusCounts = { trial: 0, active: 0, expired: 0 };
      try {
        subscriptionRevenue = db.prepare(`
          SELECT 
            COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as totalPaid,
            COUNT(CASE WHEN status = 'paid' THEN 1 END) as paidCount,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingCount
          FROM bus_subscriptions
        `).get() as any || subscriptionRevenue;
      } catch (e) { /* Table doesn't exist yet */ }

      try {
        statusCounts = db.prepare(`
          SELECT 
            CAST(SUM(CASE WHEN subscription_status = 'trial' THEN 1 ELSE 0 END) AS INT) as trial,
            CAST(SUM(CASE WHEN subscription_status = 'active' THEN 1 ELSE 0 END) AS INT) as active,
            CAST(SUM(CASE WHEN subscription_status = 'expired' OR subscription_status = 'suspended' THEN 1 ELSE 0 END) AS INT) as expired
          FROM buses
        `).get() as any || statusCounts;
      } catch (e) { /* Column doesn't exist yet */ }

      return NextResponse.json({
        buses: allBuses,
        settings: { pricePerBus, trialDays },
        revenue: subscriptionRevenue,
        statusCounts
      });
    }

    // Company gets their own buses with subscription status (backward compatible)
    let buses: any[] = [];
    try {
      buses = db.prepare(`
        SELECT b.*,
          CASE 
            WHEN b.subscription_status = 'trial' AND b.trial_end_date > datetime('now') THEN 'trial'
            WHEN b.subscription_status = 'active' AND b.subscription_end_date > datetime('now') THEN 'active'
            WHEN b.subscription_status = 'trial' AND b.trial_end_date <= datetime('now') THEN 'expired'
            WHEN b.subscription_status = 'active' AND b.subscription_end_date <= datetime('now') THEN 'expired'
            ELSE COALESCE(b.subscription_status, 'expired')
          END as current_status,
          CASE 
            WHEN b.subscription_status = 'trial' THEN b.trial_end_date
            ELSE b.subscription_end_date
          END as expires_at,
          julianday(CASE 
            WHEN b.subscription_status = 'trial' THEN b.trial_end_date
            ELSE b.subscription_end_date
          END) - julianday('now') as days_remaining
        FROM buses b
        WHERE b.company_id = ?
        ORDER BY b.id
      `).all(decoded.id);
    } catch (e) {
      // Fallback: no subscription columns, treat all as active
      buses = db.prepare(`
        SELECT b.*, 'active' as current_status, NULL as expires_at, 999 as days_remaining
        FROM buses b WHERE b.company_id = ?
        ORDER BY b.id
      `).all(decoded.id);
    }

    // Get payment history (backward compatible)
    let payments: any[] = [];
    try {
      payments = db.prepare(`
        SELECT bs.*, b.bus_name, b.bus_number
        FROM bus_subscriptions bs
        JOIN buses b ON bs.bus_id = b.id
        WHERE bs.company_id = ?
        ORDER BY bs.created_at DESC
        LIMIT 20
      `).all(decoded.id);
    } catch (e) { /* Table doesn't exist yet */ }

    // Calculate totals
    const activeBuses = (buses as any[]).filter(b => b.current_status === 'active' || b.current_status === 'trial').length;
    const expiredBuses = (buses as any[]).filter(b => b.current_status === 'expired' || b.current_status === 'suspended').length;
    const monthlyTotal = expiredBuses * pricePerBus; // Amount due for expired buses

    return NextResponse.json({
      buses,
      payments,
      settings: { pricePerBus, trialDays },
      summary: {
        totalBuses: buses.length,
        activeBuses,
        expiredBuses,
        monthlyDue: monthlyTotal
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Pay subscription for a bus
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access required' }, { status: 403 });
    }

    const body = await request.json();
    const { bus_id, months = 1, payment_method = 'mobile_money', transaction_id } = body;

    if (!bus_id) {
      return NextResponse.json({ error: 'Bus ID required' }, { status: 400 });
    }

    // Verify bus belongs to company
    const bus = db.prepare(`
      SELECT * FROM buses WHERE id = ? AND company_id = ?
    `).get(bus_id, decoded.id) as any;

    if (!bus) {
      // Debug: check if bus exists at all
      const anyBus = db.prepare(`SELECT id, company_id FROM buses WHERE id = ?`).get(bus_id) as any;
      if (anyBus) {
        console.log(`Bus ${bus_id} exists but belongs to company ${anyBus.company_id}, not ${decoded.id}`);
        return NextResponse.json({ 
          error: 'Bus not found or not owned by your company',
          debug: { requestedBusId: bus_id, requestedCompanyId: decoded.id, actualCompanyId: anyBus.company_id }
        }, { status: 404 });
      }
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    // Get subscription price (backward compatible)
    let pricePerMonth = 500;
    try {
      const priceSetting = db.prepare(`
        SELECT setting_value FROM platform_settings WHERE setting_key = 'subscription_price_per_bus'
      `).get() as any;
      pricePerMonth = parseFloat(priceSetting?.setting_value || '500');
    } catch (e) { /* Table doesn't exist */ }
    const totalAmount = pricePerMonth * months;

    // Calculate period
    const periodStart = new Date();
    let periodEnd = new Date();
    
    // If currently active, extend from end date
    if (bus.subscription_status === 'active' && bus.subscription_end_date && new Date(bus.subscription_end_date) > periodStart) {
      periodEnd = new Date(bus.subscription_end_date);
    }
    periodEnd.setMonth(periodEnd.getMonth() + months);

    // Create subscription payment record (backward compatible - create table if needed)
    try {
      // Ensure table exists
      db.exec(`
        CREATE TABLE IF NOT EXISTS bus_subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bus_id INTEGER NOT NULL,
          company_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          period_start DATE NOT NULL,
          period_end DATE NOT NULL,
          payment_method TEXT DEFAULT 'mobile_money',
          transaction_id TEXT,
          status TEXT DEFAULT 'pending',
          paid_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.prepare(`
        INSERT INTO bus_subscriptions (bus_id, company_id, amount, period_start, period_end, payment_method, transaction_id, status, paid_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', CURRENT_TIMESTAMP)
      `).run(
        bus_id,
        decoded.id,
        totalAmount,
        periodStart.toISOString().split('T')[0],
        periodEnd.toISOString().split('T')[0],
        payment_method,
        transaction_id || `SUB-${Date.now()}`
      );
    } catch (e) {
      console.error('Error recording subscription payment:', e);
      // Continue even if payment record fails
    }

    // Update bus subscription status (backward compatible - add columns if needed)
    try {
      db.prepare(`
        UPDATE buses 
        SET subscription_status = 'active', 
            subscription_start_date = ?,
            subscription_end_date = ?
        WHERE id = ?
      `).run(periodStart.toISOString(), periodEnd.toISOString(), bus_id);
    } catch (e) {
      // Try adding columns first
      try {
        db.exec(`ALTER TABLE buses ADD COLUMN subscription_status TEXT DEFAULT 'trial'`);
        db.exec(`ALTER TABLE buses ADD COLUMN subscription_start_date TEXT`);
        db.exec(`ALTER TABLE buses ADD COLUMN subscription_end_date TEXT`);
        db.exec(`ALTER TABLE buses ADD COLUMN trial_end_date TEXT`);
      } catch (alterError) { /* Columns may already exist */ }

      // Retry the update
      db.prepare(`
        UPDATE buses 
        SET subscription_status = 'active', 
            subscription_start_date = ?,
            subscription_end_date = ?
        WHERE id = ?
      `).run(periodStart.toISOString(), periodEnd.toISOString(), bus_id);
    }

    return NextResponse.json({
      message: 'Subscription activated successfully',
      subscription: {
        bus_id,
        amount: totalAmount,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        months
      }
    });
  } catch (error) {
    console.error('Error processing subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Admin can update subscription settings or manually activate/suspend
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Update settings
    if (body.setting_key && body.setting_value !== undefined) {
      db.prepare(`
        UPDATE platform_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ?
      `).run(body.setting_value.toString(), body.setting_key);

      return NextResponse.json({ message: 'Setting updated' });
    }

    // Manually update bus subscription status
    if (body.bus_id && body.subscription_status) {
      const validStatuses = ['trial', 'active', 'expired', 'suspended'];
      if (!validStatuses.includes(body.subscription_status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      let updateData: any = { subscription_status: body.subscription_status };
      
      // If activating, set end date
      if (body.subscription_status === 'active' && body.months) {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + body.months);
        updateData.subscription_end_date = endDate.toISOString();
      }

      db.prepare(`
        UPDATE buses SET subscription_status = ?, subscription_end_date = COALESCE(?, subscription_end_date)
        WHERE id = ?
      `).run(body.subscription_status, updateData.subscription_end_date || null, body.bus_id);

      return NextResponse.json({ message: 'Bus subscription updated' });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
