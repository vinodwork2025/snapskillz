import type { APIRoute } from 'astro';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export const prerender = false;

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URLSearchParams(url.search);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No slug provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const filepath = join(process.cwd(), 'src', 'content', 'blog', `${slug}.md`);
    
    if (!existsSync(filepath)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Post not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the file
    await unlink(filepath);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Post deleted successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to delete post: ' + (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};