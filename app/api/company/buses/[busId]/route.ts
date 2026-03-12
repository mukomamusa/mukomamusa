import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// PUT update bus status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ busId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Invalid token or unauthorized' }, { status: 401 });
    }

    const { busId } = await params;
    const body = await request.json();
    const { status, bus_name, total_seats, bus_type, amenities } = body;

    const companyId = decoded.id;

    // Verify the bus belongs to this company
    const bus = db.prepare(`
      SELECT id FROM buses WHERE id = ? AND company_id = ?
    `).get(busId, companyId);

    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    // Update bus - only update fields that are provided
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (bus_name) {
      updateFields.push('bus_name = ?');
      updateValues.push(bus_name);
    }
    if (total_seats) {
      updateFields.push('total_seats = ?');
      updateValues.push(total_seats);
    }
    if (bus_type) {
      updateFields.push('bus_type = ?');
      updateValues.push(bus_type);
    }
    if (amenities !== undefined) {
      updateFields.push('amenities = ?');
      updateValues.push(amenities);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateValues.push(busId, companyId);

    db.prepare(`
      UPDATE buses 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND company_id = ?
    `).run(...updateValues);

    return NextResponse.json({ 
      message: 'Bus updated successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating bus:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE bus
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ busId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Invalid token or unauthorized' }, { status: 401 });
    }

    const { busId } = await params;
    const companyId = decoded.id;

    // Verify the bus belongs to this company
    const bus = db.prepare(`
      SELECT id FROM buses WHERE id = ? AND company_id = ?
    `).get(busId, companyId);

    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    // Check if bus has any active routes
    const activeRoutes = db.prepare(`
      SELECT COUNT(*) as count FROM routes 
      WHERE bus_id = ? AND status = 'active' AND date >= date('now')
    `).get(busId) as any;

    if (activeRoutes.count > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete bus with active routes. Please deactivate routes first.' 
      }, { status: 400 });
    }

    // Soft delete by setting status to 'deleted'
    db.prepare(`
      UPDATE buses SET status = 'deleted' WHERE id = ? AND company_id = ?
    `).run(busId, companyId);

    return NextResponse.json({ 
      message: 'Bus deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting bus:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
