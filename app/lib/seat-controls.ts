import db from '@/app/lib/database-schema';

export type SeatControlStatus = 'blocked' | 'reserved';
export type SeatAvailabilityStatus = 'available' | 'booked' | 'blocked' | 'reserved';

export interface SeatSnapshot {
  seat_number: number;
  status: SeatAvailabilityStatus;
  reason: string | null;
  reserved_until: string | null;
  price: number;
}

export interface RouteSeatSnapshot {
  routeId: number;
  basePrice: number;
  totalSeats: number;
  availableSeats: number;
  bookedCount: number;
  blockedCount: number;
  reservedCount: number;
  occupancyRate: number;
  dynamicPricingEnabled: boolean;
  dynamicPriceMultiplier: number;
  seats: SeatSnapshot[];
}

interface SeatControlRow {
  seat_number: number;
  status: SeatControlStatus;
  reason: string | null;
  reserved_until: string | null;
}

// Predefined schema for dynamic columns - eliminates SQL injection risk
// Explicit whitelist of allowed tables for schema operations
const ALLOWED_SCHEMA_TABLES = ['routes', 'bookings', 'buses', 'users', 'passengers', 'tickets', 'trips'] as const;
type AllowedTable = typeof ALLOWED_SCHEMA_TABLES[number];

const DYNAMIC_COLUMNS: Record<AllowedTable, string[]> = {
  routes: [
    'dynamic_pricing_enabled INTEGER NOT NULL DEFAULT 0',
    'dynamic_price_multiplier REAL NOT NULL DEFAULT 1.0'
  ],
  bookings: [],
  buses: [],
  users: [],
  passengers: [],
  tickets: [],
  trips: []
};

function ensureColumn(tableName: string, columnName: string, definition: string) {
  // Validate table and column names using explicit whitelist to prevent SQL injection
  const validColumnPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  
  // Strict type check - only allow tables from our whitelist
  if (!ALLOWED_SCHEMA_TABLES.includes(tableName as AllowedTable) || !validColumnPattern.test(columnName)) {
    console.error('Invalid table or column name:', tableName, columnName);
    return;
  }
  
  // Double-check the table is in our whitelist before using in SQL
  const safeTableName = ALLOWED_SCHEMA_TABLES.includes(tableName as AllowedTable) ? tableName : null;
  if (!safeTableName) {
    console.error('Table not in whitelist:', tableName);
    return;
  }
  
  const columns = db.prepare(`PRAGMA table_info(${safeTableName})`).all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === columnName)) {
    // Validate definition doesn't contain dangerous SQL
    if (/[^\w\s,()]+/.test(definition)) {
      console.error('Invalid column definition - potentially dangerous SQL:', definition);
      return;
    }
    db.prepare(`ALTER TABLE ${safeTableName} ADD COLUMN ${columnName} ${definition}`).run();
  }
}

let schemaInitialized = false;

export function ensureSeatControlSchema() {
  // Skip if already initialized this session
  if (schemaInitialized) return;
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS route_seat_controls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      seat_number INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('blocked', 'reserved')),
      reason TEXT,
      reserved_until DATETIME,
      updated_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(route_id, seat_number),
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_route_seat_controls_route ON route_seat_controls(route_id);
    CREATE INDEX IF NOT EXISTS idx_route_seat_controls_status ON route_seat_controls(status);
  `);

  // Use predefined column definitions
  const routesColumns = DYNAMIC_COLUMNS['routes'] || [];
  for (const columnDef of routesColumns) {
    const columnName = columnDef.split(' ')[0];
    const definition = columnDef.substring(columnName.length).trim();
    ensureColumn('routes', columnName, definition);
  }
  
  schemaInitialized = true;
}

export function calculateSeatPrice(
  basePrice: number,
  seatNumber: number,
  occupancyRate: number,
  dynamicPricingEnabled: boolean,
  dynamicPriceMultiplier: number
): number {
  const seatTierMultiplier = seatNumber <= 4 ? 1.15 : seatNumber <= 12 ? 1.05 : 1.0;

  let demandMultiplier = 1.0;
  if (occupancyRate >= 0.85) {
    demandMultiplier = 1.2;
  } else if (occupancyRate >= 0.7) {
    demandMultiplier = 1.1;
  }

  const safeDynamicMultiplier = Math.min(Math.max(dynamicPriceMultiplier || 1, 0.5), 3);
  const dynamicMultiplier = dynamicPricingEnabled ? safeDynamicMultiplier : 1;

  const computedPrice = basePrice * seatTierMultiplier * demandMultiplier * dynamicMultiplier;
  return Math.round(computedPrice * 100) / 100;
}

export function getRouteSeatSnapshot(routeId: number): RouteSeatSnapshot | null {
  ensureSeatControlSchema();

  const route = db.prepare(`
    SELECT
      r.id,
      r.price,
      r.available_seats,
      COALESCE(r.dynamic_pricing_enabled, 0) as dynamic_pricing_enabled,
      COALESCE(r.dynamic_price_multiplier, 1.0) as dynamic_price_multiplier,
      b.total_seats
    FROM routes r
    JOIN buses b ON r.bus_id = b.id
    WHERE r.id = ?
  `).get(routeId) as any;

  if (!route) return null;

  const bookedRows = db.prepare(`
    SELECT seat_numbers
    FROM bookings
    WHERE route_id = ? AND status IN ('pending', 'confirmed')
  `).all(routeId) as Array<{ seat_numbers: string }>;

  const bookedSeats = new Set<number>();
  bookedRows.forEach((row) => {
    row.seat_numbers
      .split(',')
      .map((value) => parseInt(value.trim(), 10))
      .filter((value) => Number.isInteger(value) && value > 0)
      .forEach((value) => bookedSeats.add(value));
  });

  const controls = db.prepare(`
    SELECT seat_number, status, reason, reserved_until
    FROM route_seat_controls
    WHERE route_id = ?
      AND (
        status = 'blocked'
        OR (status = 'reserved' AND (reserved_until IS NULL OR datetime(reserved_until) > datetime('now')))
      )
  `).all(routeId) as SeatControlRow[];

  const controlsBySeat = new Map<number, SeatControlRow>();
  controls.forEach((control) => {
    controlsBySeat.set(control.seat_number, control);
  });

  const totalSeats = route.total_seats || 0;
  const occupancyRate = totalSeats > 0 ? bookedSeats.size / totalSeats : 0;

  const seats: SeatSnapshot[] = [];
  let blockedCount = 0;
  let reservedCount = 0;

  for (let seatNumber = 1; seatNumber <= totalSeats; seatNumber++) {
    let status: SeatAvailabilityStatus = 'available';
    let reason: string | null = null;
    let reservedUntil: string | null = null;

    if (bookedSeats.has(seatNumber)) {
      status = 'booked';
    } else {
      const control = controlsBySeat.get(seatNumber);
      if (control) {
        status = control.status;
        reason = control.reason;
        reservedUntil = control.reserved_until;
      }
    }

    if (status === 'blocked') blockedCount += 1;
    if (status === 'reserved') reservedCount += 1;

    seats.push({
      seat_number: seatNumber,
      status,
      reason,
      reserved_until: reservedUntil,
      price: calculateSeatPrice(
        route.price,
        seatNumber,
        occupancyRate,
        !!route.dynamic_pricing_enabled,
        route.dynamic_price_multiplier
      ),
    });
  }

  return {
    routeId: routeId,
    basePrice: route.price,
    totalSeats,
    availableSeats: Math.max(totalSeats - bookedSeats.size - blockedCount - reservedCount, 0),
    bookedCount: bookedSeats.size,
    blockedCount,
    reservedCount,
    occupancyRate,
    dynamicPricingEnabled: !!route.dynamic_pricing_enabled,
    dynamicPriceMultiplier: route.dynamic_price_multiplier,
    seats,
  };
}
