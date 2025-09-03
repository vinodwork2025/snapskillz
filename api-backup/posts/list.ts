import type { APIRoute } from 'astro';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const contentDir = join(process.cwd(), 'src', 'content', 'blog');
    
    if (!existsSync(contentDir)) {
      return new Response(JSON.stringify({ 
        success: true, 
        posts: [] 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const files = await readdir(contentDir);
    const markdownFiles = files.filter(file => file.endsWith('.md'));

    const posts = await Promise.all(
      markdownFiles.map(async (filename) => {
        const filepath = join(contentDir, filename);
        const content = await readFile(filepath, 'utf8');
        const stats = await stat(filepath);
        
        // Extract frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        const frontmatter: any = {};
        
        if (frontmatterMatch) {
          const frontmatterLines = frontmatterMatch[1].split('\n');
          frontmatterLines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
              let value = valueParts.join(':').trim();
              // Remove quotes
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
              }
              frontmatter[key.trim()] = value;
            }
          });
        }

        // Extract content preview
        const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
        const preview = contentWithoutFrontmatter
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .substring(0, 200) + '...';

        return {
          filename,
          slug: filename.replace('.md', ''),
          title: frontmatter.title || filename.replace('.md', ''),
          description: frontmatter.description || '',
          author: frontmatter.author || '',
          publishDate: frontmatter.publishDate || '',
          category: frontmatter.category || 'general',
          tags: frontmatter.tags || '',
          featured: frontmatter.featured === 'true',
          image: frontmatter.image || '',
          readTime: frontmatter.readTime || 0,
          draft: frontmatter.draft === 'true',
          preview,
          lastModified: stats.mtime.toISOString(),
          fileSize: stats.size
        };
      })
    );

    // Sort by last modified (newest first)
    posts.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return new Response(JSON.stringify({ 
      success: true, 
      posts,
      total: posts.length 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error listing posts:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to list posts: ' + (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};