import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/app/lib'; // Now it's clear
import { seedDatabase } from '@/app/lib/seed';

export async function GET() {
  try {
    await initializeDatabase(); // Call the function from database.js
    await seedDatabase();
    
    return NextResponse.json({
      message: 'Database initialized and seeded successfully',
      version: '2.0.0',
      credentials: {
        companies: [
          { email: 'info@mazhindubuses.com', password: 'password123', license: 'MBS2024001' },
          { email: 'contact@powertools.com', password: 'password123', license: 'PTT2024002' },
          { email: 'info@juldan.com', password: 'password123', license: 'JDM2024003' },
        ],
        customer: { email: 'customer@example.com', password: 'password123' },
        admin: { email: 'admin@zambiabus.com', password: 'password123' },
      },
      tables: [
        'users', 'drivers', 'buses', 'routes', 'bookings',
        'passengers', 'tickets', 'payments', 'refunds',
        'trip_manifests', 'notifications'
      ]
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to initialize database' },
      { status: 500 }
    );
  }
}