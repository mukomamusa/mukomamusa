import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET admin statistics and data
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get user counts
    const userCounts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN user_type = 'customer' THEN 1 ELSE 0 END) as customers,
        SUM(CASE WHEN user_type = 'company' THEN 1 ELSE 0 END) as companies,
        SUM(CASE WHEN user_type = 'admin' THEN 1 ELSE 0 END) as admins
      FROM users
    `).get() as any;

    // Get bus count
    const busCount = db.prepare('SELECT COUNT(*) as count FROM buses').get() as any;

    // Get route counts
    const routeCounts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM routes
    `).get() as any;

    // Get booking stats with commission (backward compatible)
    let bookingStats: any;
    try {
      // Try with commission columns first
      bookingStats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) as today,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END), 0) as revenue,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN commission_amount ELSE 0 END), 0) as totalCommission,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN company_earnings ELSE 0 END), 0) as companyPayouts
        FROM bookings
      `).get();
    } catch (e) {
      // Fallback: calculate commission from revenue (7.5%)
      bookingStats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) as today,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END), 0) as revenue
        FROM bookings
      `).get() as any;
      const revenue = bookingStats?.revenue || 0;
      bookingStats.totalCommission = Math.round(revenue * 0.075 * 100) / 100;
      bookingStats.companyPayouts = Math.round((revenue - bookingStats.totalCommission) * 100) / 100;
    }

    // Get current commission rate from settings (backward compatible)
    let currentCommissionRate = 7.5;
    try {
      const commissionSetting = db.prepare(`
        SELECT setting_value FROM platform_settings WHERE setting_key = 'commission_rate'
      `).get() as any;
      if (commissionSetting) {
        currentCommissionRate = parseFloat(commissionSetting.setting_value) * 100;
      }
    } catch (e) { /* Table doesn't exist yet */ }

    // Get subscription stats (backward compatible)
    let subscriptionStats = { subscriptionRevenue: 0, paidSubscriptions: 0 };
    try {
      subscriptionStats = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as subscriptionRevenue,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paidSubscriptions
        FROM bus_subscriptions
      `).get() as any || subscriptionStats;
    } catch (e) { /* Table doesn't exist yet */ }

    // Get bus subscription status counts (backward compatible)
    let busSubscriptionCounts = { trialBuses: 0, activeBuses: 0, expiredBuses: 0 };
    try {
      busSubscriptionCounts = db.prepare(`
        SELECT 
          SUM(CASE WHEN subscription_status = 'trial' THEN 1 ELSE 0 END) as trialBuses,
          SUM(CASE WHEN subscription_status = 'active' THEN 1 ELSE 0 END) as activeBuses,
          SUM(CASE WHEN subscription_status IN ('expired', 'suspended') THEN 1 ELSE 0 END) as expiredBuses
        FROM buses
      `).get() as any || busSubscriptionCounts;
    } catch (e) { 
      // Column doesn't exist, count all buses as active
      busSubscriptionCounts.activeBuses = busCount?.count || 0;
    }

    // Get subscription price (backward compatible)
    let subscriptionPricePerBus = 500;
    try {
      const subPriceSetting = db.prepare(`
        SELECT setting_value FROM platform_settings WHERE setting_key = 'subscription_price_per_bus'
      `).get() as any;
      if (subPriceSetting) {
        subscriptionPricePerBus = parseFloat(subPriceSetting.setting_value);
      }
    } catch (e) { /* Table doesn't exist yet */ }

    // Get all users with verification documents for companies
    const users = db.prepare(`
      SELECT id, email, name, phone, user_type, company_name, created_at, status,
             license_number, company_registration_number, company_address
      FROM users
      ORDER BY created_at DESC
    `).all();

    // Get companies with stats including net earnings (backward compatible)
    let companies: any[] = [];
    try {
      companies = db.prepare(`
        SELECT 
          u.id,
          u.company_name,
          u.email,
          u.phone,
          u.status,
          COUNT(DISTINCT bus.id) as busCount,
          COUNT(DISTINCT r.id) as routeCount,
          COUNT(DISTINCT b.id) as bookingCount,
          COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.total_price ELSE 0 END), 0) as revenue,
          COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.commission_amount ELSE 0 END), 0) as commissionPaid,
          COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.company_earnings ELSE 0 END), 0) as netEarnings
        FROM users u
        LEFT JOIN buses bus ON bus.company_id = u.id
        LEFT JOIN routes r ON r.bus_id = bus.id
        LEFT JOIN bookings b ON b.route_id = r.id
        WHERE u.user_type = 'company'
        GROUP BY u.id
        ORDER BY netEarnings DESC
      `).all();
    } catch (e) {
      // Fallback without commission columns
      companies = db.prepare(`
        SELECT 
          u.id,
          u.company_name,
          u.email,
          u.phone,
          u.status,
          COUNT(DISTINCT bus.id) as busCount,
          COUNT(DISTINCT r.id) as routeCount,
          COUNT(DISTINCT b.id) as bookingCount,
          COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.total_price ELSE 0 END), 0) as revenue
        FROM users u
        LEFT JOIN buses bus ON bus.company_id = u.id
        LEFT JOIN routes r ON r.bus_id = bus.id
        LEFT JOIN bookings b ON b.route_id = r.id
        WHERE u.user_type = 'company'
        GROUP BY u.id
        ORDER BY revenue DESC
      `).all().map((c: any) => ({
        ...c,
        commissionPaid: Math.round(c.revenue * 0.075 * 100) / 100,
        netEarnings: Math.round(c.revenue * 0.925 * 100) / 100
      }));
    }

    // Get recent bookings with details
    const recentBookings = db.prepare(`
      SELECT 
        b.id,
        b.booking_reference,
        b.total_price,
        b.status,
        b.created_at,
        u.name as customer_name,
        r.origin,
        r.destination,
        r.date,
        comp.company_name
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN routes r ON b.route_id = r.id
      JOIN buses bus ON r.bus_id = bus.id
      JOIN users comp ON bus.company_id = comp.id
      ORDER BY b.created_at DESC
      LIMIT 50
    `).all();

    return NextResponse.json({
      stats: {
        totalUsers: userCounts.total || 0,
        totalCustomers: userCounts.customers || 0,
        totalCompanies: userCounts.companies || 0,
        totalBuses: busCount.count || 0,
        totalRoutes: routeCounts.total || 0,
        activeRoutes: routeCounts.active || 0,
        totalBookings: bookingStats.total || 0,
        todayBookings: bookingStats.today || 0,
        cancelledBookings: bookingStats.cancelled || 0,
        totalRevenue: bookingStats.revenue || 0,
        // Commission stats
        commissionRate: currentCommissionRate,
        totalCommission: bookingStats.totalCommission || 0,
        companyPayouts: bookingStats.companyPayouts || 0,
        // Subscription stats
        subscriptionRevenue: subscriptionStats.subscriptionRevenue || 0,
        subscriptionPricePerBus,
        trialBuses: busSubscriptionCounts.trialBuses || 0,
        activeBuses: busSubscriptionCounts.activeBuses || 0,
        expiredBuses: busSubscriptionCounts.expiredBuses || 0
      },
      users,
      companies,
      recentBookings
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
