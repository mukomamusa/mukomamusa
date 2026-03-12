import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// Official Zambian cities and major towns for bus routes
const ZAMBIAN_CITIES = [
  'Lusaka', 'Ndola', 'Kitwe', 'Livingstone', 'Chipata', 'Solwezi', 'Kabwe',
  'Chingola', 'Mufulira', 'Kasama', 'Luanshya', 'Choma', 'Mansa', 'Mongu',
  'Mazabuka', 'Kafue', 'Monze', 'Kalulushi', 'Kapiri Mposhi', 'Mpika',
  'Chililabombwe', 'Petauke', 'Nakonde', 'Sesheke', 'Siavonga', 'Chirundu',
  'Mbala', 'Lundazi', 'Samfya', 'Senanga', 'Kaoma', 'Kalabo', 'Kawambwa',
  'Nchelenge', 'Serenje', 'Mkushi', 'Isoka', 'Chinsali', 'Mumbwa',
  'Itezhi-Tezhi', 'Kazungula', 'Victoria Falls Border'
];

const normalizeCity = (value: string | null) => value?.trim() || null;
const isIsoDate = (value: string | null) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);

// GET routes with search filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const companyId = searchParams.get('company_id');
    const flexibleDays = searchParams.get('flexible_days'); // e.g., '3' for ±3 days

    const normalizedOrigin = normalizeCity(origin);
    const normalizedDestination = normalizeCity(destination);

    // Check if caller is the company owner (to show their own buses regardless of subscription)
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let isCompanyOwner = false;
    let ownerId: number | null = null;
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.user_type === 'company') {
        isCompanyOwner = true;
        ownerId = decoded.id;
      }
    }

    if (normalizedOrigin && !ZAMBIAN_CITIES.includes(normalizedOrigin)) {
      return NextResponse.json({ error: 'Invalid origin city' }, { status: 400 });
    }

    if (normalizedDestination && !ZAMBIAN_CITIES.includes(normalizedDestination)) {
      return NextResponse.json({ error: 'Invalid destination city' }, { status: 400 });
    }

    if (normalizedOrigin && normalizedDestination && normalizedOrigin === normalizedDestination) {
      return NextResponse.json({ error: 'Origin and destination cannot be the same' }, { status: 400 });
    }

    if (date && !isIsoDate(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    if (dateFrom && !isIsoDate(dateFrom)) {
      return NextResponse.json({ error: 'Invalid date_from format. Use YYYY-MM-DD' }, { status: 400 });
    }

    if (dateTo && !isIsoDate(dateTo)) {
      return NextResponse.json({ error: 'Invalid date_to format. Use YYYY-MM-DD' }, { status: 400 });
    }

    // Calculate date range for flexible search
    let effectiveDateFrom = dateFrom;
    let effectiveDateTo = dateTo;
    
    if (date && flexibleDays) {
      const days = parseInt(flexibleDays);
      const baseDate = new Date(date);
      const fromDate = new Date(baseDate);
      fromDate.setDate(fromDate.getDate() - days);
      const toDate = new Date(baseDate);
      toDate.setDate(toDate.getDate() + days);
      effectiveDateFrom = fromDate.toISOString().split('T')[0];
      effectiveDateTo = toDate.toISOString().split('T')[0];
    }

    // Try new query with subscription columns, fallback to basic query
    let routes;
    try {
      let query = `
        SELECT 
          r.*,
          b.bus_name,
          b.bus_number,
          b.bus_type,
          b.amenities,
          b.total_seats,
          b.subscription_status,
          b.company_id,
          u.company_name,
          u.company_logo_url
        FROM routes r
        JOIN buses b ON r.bus_id = b.id
        JOIN users u ON b.company_id = u.id
        WHERE r.status = 'active'
      `;

      const params: any[] = [];

      // For public searches, only show routes from buses with active subscriptions or in trial
      if (!isCompanyOwner || (companyId && parseInt(companyId) !== ownerId)) {
        query += ` AND (
          b.subscription_status IS NULL
          OR (b.subscription_status = 'trial' AND (b.trial_end_date IS NULL OR datetime(b.trial_end_date) > datetime('now')))
          OR (b.subscription_status = 'active' AND (b.subscription_end_date IS NULL OR datetime(b.subscription_end_date) > datetime('now')))
        )`;
      }

      if (normalizedOrigin) {
        query += ' AND r.origin = ?';
        params.push(normalizedOrigin);
      }

      if (normalizedDestination) {
        query += ' AND r.destination = ?';
        params.push(normalizedDestination);
      }

      // Support both single date and date range
      if (effectiveDateFrom && effectiveDateTo) {
        query += ' AND r.date BETWEEN ? AND ?';
        params.push(effectiveDateFrom, effectiveDateTo);
      } else if (date) {
        query += ' AND r.date = ?';
        params.push(date);
      }

      if (companyId) {
        query += ' AND b.company_id = ?';
        params.push(companyId);
      }

      query += ' ORDER BY r.date, r.departure_time';

      routes = db.prepare(query).all(...params);
    } catch (e) {
      // Fallback: no subscription columns yet, show all routes (backward compatible)
      let query = `
        SELECT 
          r.*,
          b.bus_name,
          b.bus_number,
          b.bus_type,
          b.amenities,
          b.total_seats,
          'active' as subscription_status,
          u.company_name,
          u.company_logo_url
        FROM routes r
        JOIN buses b ON r.bus_id = b.id
        JOIN users u ON b.company_id = u.id
        WHERE r.status = 'active'
      `;

      const params: any[] = [];

      if (normalizedOrigin) {
        query += ' AND r.origin = ?';
        params.push(normalizedOrigin);
      }

      if (normalizedDestination) {
        query += ' AND r.destination = ?';
        params.push(normalizedDestination);
      }

      // Support both single date and date range
      if (effectiveDateFrom && effectiveDateTo) {
        query += ' AND r.date BETWEEN ? AND ?';
        params.push(effectiveDateFrom, effectiveDateTo);
      } else if (date) {
        query += ' AND r.date = ?';
        params.push(date);
      }

      if (companyId) {
        query += ' AND b.company_id = ?';
        params.push(companyId);
      }

      query += ' ORDER BY r.date, r.departure_time';

      routes = db.prepare(query).all(...params);
    }

    // Fetch bus images for each unique bus and attach preview images
    try {
      const busIds = [...new Set(routes.map((r: any) => r.bus_id))];
      if (busIds.length > 0) {
        const placeholders = busIds.map(() => '?').join(',');
        const busImages = db.prepare(`
          SELECT bus_id, image_url, image_type 
          FROM bus_images 
          WHERE bus_id IN (${placeholders})
          ORDER BY display_order ASC
        `).all(...busIds) as any[];

        // Group images by bus_id
        const imagesByBus: Record<number, any[]> = {};
        busImages.forEach((img: any) => {
          if (!imagesByBus[img.bus_id]) {
            imagesByBus[img.bus_id] = [];
          }
          imagesByBus[img.bus_id].push(img);
        });

        // Attach images to routes
        routes = routes.map((route: any) => ({
          ...route,
          bus_images: imagesByBus[route.bus_id] || [],
          bus_preview_image: imagesByBus[route.bus_id]?.[0]?.image_url || null
        }));
      }
    } catch (e) {
      // bus_images table might not exist yet, continue without images
      routes = routes.map((route: any) => ({
        ...route,
        bus_images: [],
        bus_preview_image: null
      }));
    }

    return NextResponse.json({ routes });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new route (company only)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json(
        { error: 'Unauthorized - Company access only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      bus_id,
      origin,
      destination,
      departure_time,
      arrival_time,
      price,
      date,
      intermediate_stops,
      driver_id,
    } = body;

    if (!bus_id || !origin || !destination || !departure_time || !arrival_time || !price || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate origin and destination are valid Zambian cities
    if (!ZAMBIAN_CITIES.includes(origin)) {
      return NextResponse.json(
        { error: `Invalid origin city. Please select a valid Zambian city.` },
        { status: 400 }
      );
    }

    if (!ZAMBIAN_CITIES.includes(destination)) {
      return NextResponse.json(
        { error: `Invalid destination city. Please select a valid Zambian city.` },
        { status: 400 }
      );
    }

    if (origin === destination) {
      return NextResponse.json(
        { error: 'Origin and destination cannot be the same' },
        { status: 400 }
      );
    }

    // Verify bus belongs to company and has a valid subscription window
    const bus = db.prepare(
      `SELECT total_seats, subscription_status, trial_end_date, subscription_end_date
       FROM buses
       WHERE id = ? AND company_id = ?`
    ).get(bus_id, decoded.id) as any;

    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found or does not belong to your company' },
        { status: 404 }
      );
    }

    const now = new Date();
    const hasValidTrial =
      bus.subscription_status === 'trial' &&
      (!bus.trial_end_date || new Date(bus.trial_end_date) > now);
    const hasValidActiveSubscription =
      bus.subscription_status === 'active' &&
      (!bus.subscription_end_date || new Date(bus.subscription_end_date) > now);

    if (!hasValidTrial && !hasValidActiveSubscription) {
      return NextResponse.json(
        {
          error: 'Bus subscription is expired. Renew subscription or activate trial before creating public routes.'
        },
        { status: 400 }
      );
    }

    // Verify driver belongs to company (if provided)
    if (driver_id) {
      const driver = db.prepare('SELECT id FROM drivers WHERE id = ? AND company_id = ? AND status = ?')
        .get(driver_id, decoded.id, 'active');
      if (!driver) {
        return NextResponse.json(
          { error: 'Driver not found or not active' },
          { status: 404 }
        );
      }
    }

    const stmt = db.prepare(`
      INSERT INTO routes (bus_id, driver_id, origin, destination, departure_time, arrival_time, price, date, intermediate_stops, available_seats, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    const result = stmt.run(
      bus_id,
      driver_id || null,
      origin,
      destination,
      departure_time,
      arrival_time,
      price,
      date,
      intermediate_stops || '',
      bus.total_seats
    );

    return NextResponse.json(
      {
        message: 'Route created successfully',
        routeId: result.lastInsertRowid,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update route (assign driver, change status, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.user_type !== 'company' && decoded.user_type !== 'admin')) {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const body = await request.json();
    const { route_id, driver_id, status, cancellation_reason, departure_time, arrival_time, price } = body;

    if (!route_id) {
      return NextResponse.json({ error: 'Route ID required' }, { status: 400 });
    }

    // Verify route ownership
    const route = db.prepare(`
      SELECT r.*, bus.company_id FROM routes r
      JOIN buses bus ON r.bus_id = bus.id
      WHERE r.id = ?
    `).get(route_id) as any;

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    if (decoded.user_type === 'company' && route.company_id !== decoded.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    // Assign driver
    if (driver_id !== undefined) {
      if (driver_id === null) {
        updates.push('driver_id = NULL');
      } else {
        // Verify driver belongs to company
        const driver = db.prepare('SELECT id FROM drivers WHERE id = ? AND company_id = ? AND status = ?')
          .get(driver_id, route.company_id, 'active');
        if (!driver) {
          return NextResponse.json({ error: 'Driver not found or not active' }, { status: 404 });
        }
        updates.push('driver_id = ?');
        values.push(driver_id);
      }
    }

    // Update status
    if (status) {
      const validStatuses = ['active', 'cancelled', 'completed', 'departed', 'delayed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.push('status = ?');
      values.push(status);

      if (status === 'cancelled' && cancellation_reason) {
        updates.push('cancellation_reason = ?');
        values.push(cancellation_reason);
      }
    }

    // Update times/price
    if (departure_time) { updates.push('departure_time = ?'); values.push(departure_time); }
    if (arrival_time) { updates.push('arrival_time = ?'); values.push(arrival_time); }
    if (price) { updates.push('price = ?'); values.push(price); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(route_id);
    db.prepare(`UPDATE routes SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return NextResponse.json({ message: 'Route updated successfully' });
  } catch (error) {
    console.error('Error updating route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}