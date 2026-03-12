import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import db from '@/app/lib/database-schema';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_IMAGES_PER_BUS = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Ensure bus_images table exists
function ensureBusImagesTable() {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS bus_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bus_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        image_type TEXT DEFAULT 'general',
        caption TEXT,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
      )
    `).run();
  } catch (e) {
    // Table might already exist
  }
}

// GET bus images
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busId = searchParams.get('bus_id');

    if (!busId) {
      return NextResponse.json({ error: 'bus_id is required' }, { status: 400 });
    }

    ensureBusImagesTable();

    const images = db.prepare(`
      SELECT * FROM bus_images 
      WHERE bus_id = ? 
      ORDER BY display_order ASC, created_at ASC
    `).all(busId);

    return NextResponse.json({ success: true, images });

  } catch (error: any) {
    console.error('Error fetching bus images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

// POST upload bus images
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

    ensureBusImagesTable();

    const formData = await request.formData();
    const busId = formData.get('bus_id') as string;
    const imageType = (formData.get('image_type') as string) || 'general';
    const caption = formData.get('caption') as string;
    const files = formData.getAll('images') as File[];

    if (!busId) {
      return NextResponse.json({ error: 'bus_id is required' }, { status: 400 });
    }

    // Verify bus belongs to company
    const bus = db.prepare('SELECT id FROM buses WHERE id = ? AND company_id = ?')
      .get(busId, decoded.id);
    
    if (!bus) {
      return NextResponse.json({ error: 'Bus not found or unauthorized' }, { status: 404 });
    }

    // Check current image count
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM bus_images WHERE bus_id = ?')
      .get(busId) as any;
    
    if (currentCount.count + files.length > MAX_IMAGES_PER_BUS) {
      return NextResponse.json({ 
        error: `Maximum ${MAX_IMAGES_PER_BUS} images per bus. You have ${currentCount.count} images.` 
      }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'buses', busId);
    await mkdir(uploadDir, { recursive: true });

    const uploadedImages: any[] = [];

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        continue; // Skip invalid files
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        continue; // Skip large files
      }

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `bus_${busId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
      const filepath = path.join(uploadDir, filename);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // Get next display order
      const maxOrder = db.prepare('SELECT COALESCE(MAX(display_order), 0) as max_order FROM bus_images WHERE bus_id = ?').get(busId) as any;
      const nextOrder = (maxOrder?.max_order || 0) + 1;

      // Save to database
      const imageUrl = `/uploads/buses/${busId}/${filename}`;
      const result = db.prepare(`
        INSERT INTO bus_images (bus_id, image_url, image_type, caption, display_order)
        VALUES (?, ?, ?, ?, ?)
      `).run(busId, imageUrl, imageType, caption || null, nextOrder);

      uploadedImages.push({
        id: result.lastInsertRowid,
        bus_id: parseInt(busId),
        image_url: imageUrl,
        image_type: imageType,
        caption: caption || null
      });
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json({ 
        error: 'No valid images uploaded. Check file types (JPG, PNG, WebP, GIF) and size (max 2MB)' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      images: uploadedImages 
    });

  } catch (error: any) {
    console.error('Error uploading bus images:', error);
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 });
  }
}

// DELETE remove a bus image
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

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('image_id');

    if (!imageId) {
      return NextResponse.json({ error: 'image_id is required' }, { status: 400 });
    }

    ensureBusImagesTable();

    // Get image info and verify ownership
    const image = db.prepare(`
      SELECT bi.*, b.company_id 
      FROM bus_images bi
      JOIN buses b ON bi.bus_id = b.id
      WHERE bi.id = ?
    `).get(imageId) as any;

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (image.company_id !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Try to delete the file
    try {
      const filepath = path.join(process.cwd(), 'public', image.image_url);
      await unlink(filepath);
    } catch (e) {
      // File might not exist, continue with DB deletion
    }

    // Delete from database
    db.prepare('DELETE FROM bus_images WHERE id = ?').run(imageId);

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });

  } catch (error: any) {
    console.error('Error deleting bus image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
