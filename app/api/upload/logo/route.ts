import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import db from '@/app/lib/database-schema';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// POST upload company logo
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 2MB' 
      }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `company_${decoded.id}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save URL to database
    const logoUrl = `/uploads/logos/${filename}`;
    
    try {
      db.prepare('UPDATE users SET company_logo_url = ? WHERE id = ?').run(logoUrl, decoded.id);
    } catch (e) {
      // Column might not exist yet, try adding it
      try {
        db.prepare('ALTER TABLE users ADD COLUMN company_logo_url TEXT').run();
        db.prepare('UPDATE users SET company_logo_url = ? WHERE id = ?').run(logoUrl, decoded.id);
      } catch (e2) {
        // Column already exists, just update
        db.prepare('UPDATE users SET company_logo_url = ? WHERE id = ?').run(logoUrl, decoded.id);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Logo uploaded successfully',
      logo_url: logoUrl 
    });

  } catch (error: any) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
  }
}

// DELETE remove company logo
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    // Clear logo URL from database
    db.prepare('UPDATE users SET company_logo_url = NULL WHERE id = ?').run(decoded.id);

    return NextResponse.json({ success: true, message: 'Logo removed successfully' });

  } catch (error: any) {
    console.error('Error removing logo:', error);
    return NextResponse.json({ error: 'Failed to remove logo' }, { status: 500 });
  }
}
