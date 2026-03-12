import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';

// POST: Create a new review
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { booking_id, company_id, customer_id, rating, review_text } = body;
  // Debugging logs
  console.log('POST /api/reviews body:', body);
  console.log('Fields:', { booking_id, company_id, customer_id, rating, review_text });
  if (!company_id || !customer_id || !rating) {
    console.log('Missing required fields:', { company_id, customer_id, rating });
    return NextResponse.json({ error: 'Missing required fields', debug: { company_id, customer_id, rating, body } }, { status: 400 });
  }
  const stmt = db.prepare(`INSERT INTO reviews (booking_id, company_id, customer_id, rating, review_text) VALUES (?, ?, ?, ?, ?)`);
  const result = stmt.run(booking_id, company_id, customer_id, rating, review_text);
  return NextResponse.json({ id: result.lastInsertRowid, status: 'pending' });
}

// GET: Fetch reviews (by company, status, or customer)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const company_id = searchParams.get('company_id');
  const status = searchParams.get('status');
  const customer_id = searchParams.get('customer_id');
  
  let query = `
    SELECT r.*, 
           u.name as customer_name,
           u.email as customer_email
    FROM reviews r
    LEFT JOIN users u ON r.customer_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (company_id) { query += ' AND r.company_id = ?'; params.push(company_id); }
  if (status) { query += ' AND r.status = ?'; params.push(status); }
  if (customer_id) { query += ' AND r.customer_id = ?'; params.push(customer_id); }
  
  query += ' ORDER BY r.created_at DESC';
  
  const reviews = db.prepare(query).all(...params);
  return NextResponse.json(reviews);
}

// PATCH: Approve/reject a review (admin)
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status } = body;
  if (!id || !['approved','rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, id);
  return NextResponse.json({ id, status });
}
