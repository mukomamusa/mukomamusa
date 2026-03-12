import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { routes } = body;
    
    if (!routes || !Array.isArray(routes) || routes.length === 0) {
      return NextResponse.json({ error: 'No routes provided' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    // Use transaction for bulk insert
    const insertRoute = db.prepare(`
      INSERT INTO routes (
        company_id, bus_id, origin, destination, intermediate_stops,
        departure_time, arrival_time, date, price, available_seats,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
    `);

    const startTransaction = db.prepare('BEGIN TRANSACTION');
    const commitTransaction = db.prepare('COMMIT');
    const rollbackTransaction = db.prepare('ROLLBACK');

    try {
      startTransaction.run();

      for (const route of routes) {
        try {
          const result = insertRoute.run(
            route.company_id,
            route.bus_id,
            route.origin,
            route.destination,
            route.intermediate_stops || null,
            route.departure_time,
            route.arrival_time,
            route.date,
            route.price,
            route.available_seats || 40 // Default seat count
          );
          
          results.push({
            id: result.lastInsertRowid,
            date: route.date,
            success: true
          });
        } catch (error) {
          // FIX: Properly handle unknown error type
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Unknown error occurred';
            
          errors.push({
            date: route.date,
            error: errorMessage
          });
        }
      }

      if (errors.length > 0) {
        rollbackTransaction.run();
        return NextResponse.json({
          error: 'Failed to create some routes',
          errors
        }, { status: 400 });
      }

      commitTransaction.run();

      return NextResponse.json({
        success: true,
        count: results.length,
        routes: results
      });

    } catch (error) {
      rollbackTransaction.run();
      throw error;
    }

  } catch (error) {
    console.error('Error creating bulk routes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create routes';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}