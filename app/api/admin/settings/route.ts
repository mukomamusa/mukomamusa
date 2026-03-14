import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken, TokenPayload } from '@/app/lib/auth';

// GET - Fetch all platform settings
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

    // Get all settings (backward compatible)
    let settings: any[] = [];
    try {
      settings = db.prepare(`
        SELECT setting_key, setting_value, description, updated_at
        FROM platform_settings
        ORDER BY setting_key
      `).all();
    } catch (e) {
      // Table doesn't exist yet - return defaults
      settings = [
        { setting_key: 'commission_rate', setting_value: '0.075', description: 'Platform commission rate (7.5%)' },
        { setting_key: 'subscription_price_per_bus', setting_value: '500', description: 'Monthly subscription price per bus in ZMW' },
        { setting_key: 'subscription_trial_days', setting_value: '14', description: 'Free trial period in days for new buses' }
      ];
    }

    // Convert to object format
    const settingsMap: Record<string, { value: string; description: string; updated_at?: string }> = {};
    settings.forEach((s: any) => {
      settingsMap[s.setting_key] = {
        value: s.setting_value,
        description: s.description,
        updated_at: s.updated_at
      };
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update platform settings
export async function PUT(request: NextRequest) {
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
    const { commission_rate, subscription_price_per_bus, subscription_trial_days } = body;

    const errors: string[] = [];

    // Validate commission rate (1% - 30%)
    if (commission_rate !== undefined) {
      const rate = parseFloat(commission_rate);
      if (isNaN(rate) || rate < 0.01 || rate > 0.30) {
        errors.push('Commission rate must be between 1% (0.01) and 30% (0.30)');
      }
    }

    // Validate subscription price (K100 - K5000)
    if (subscription_price_per_bus !== undefined) {
      const price = parseFloat(subscription_price_per_bus);
      if (isNaN(price) || price < 100 || price > 5000) {
        errors.push('Subscription price must be between K100 and K5000');
      }
    }

    // Validate trial days (0 - 90)
    if (subscription_trial_days !== undefined) {
      const days = parseInt(subscription_trial_days);
      if (isNaN(days) || days < 0 || days > 90) {
        errors.push('Trial period must be between 0 and 90 days');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    }

    // Update settings (backward compatible - create table if needed)
    try {
      // Ensure table exists
      db.exec(`
        CREATE TABLE IF NOT EXISTS platform_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          setting_key TEXT UNIQUE NOT NULL,
          setting_value TEXT NOT NULL,
          description TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const updateStmt = db.prepare(`
        INSERT INTO platform_settings (setting_key, setting_value, description, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(setting_key) DO UPDATE SET
          setting_value = excluded.setting_value,
          updated_at = CURRENT_TIMESTAMP
      `);

      if (commission_rate !== undefined) {
        updateStmt.run('commission_rate', commission_rate.toString(), 'Platform commission rate');
      }
      if (subscription_price_per_bus !== undefined) {
        updateStmt.run('subscription_price_per_bus', subscription_price_per_bus.toString(), 'Monthly subscription price per bus in ZMW');
      }
      if (subscription_trial_days !== undefined) {
        updateStmt.run('subscription_trial_days', subscription_trial_days.toString(), 'Free trial period in days for new buses');
      }

      return NextResponse.json({ 
        message: 'Settings updated successfully',
        updated: {
          commission_rate,
          subscription_price_per_bus,
          subscription_trial_days
        }
      });
    } catch (e) {
      console.error('Error updating settings:', e);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}