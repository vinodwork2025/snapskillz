import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No file provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'File size too large. Maximum size is 10MB.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'images', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const buffer = await file.arrayBuffer();
    const hash = createHash('md5').update(Buffer.from(buffer)).digest('hex');
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${hash}.${extension}`;
    const filepath = join(uploadDir, filename);

    // Save file
    await writeFile(filepath, Buffer.from(buffer));

    // Return public URL
    const publicUrl = `/images/uploads/${filename}`;

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'File uploaded successfully!',
      filename,
      url: publicUrl,
      size: file.size,
      type: file.type
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to upload file: ' + (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};