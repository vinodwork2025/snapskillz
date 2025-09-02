import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
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

    const content = await readFile(filepath, 'utf8');
    
    // Extract frontmatter and content
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid post format' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const frontmatter: any = {};
    const frontmatterLines = frontmatterMatch[1].split('\n');
    
    frontmatterLines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        let value = valueParts.join(':').trim();
        // Remove quotes
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        // Handle arrays
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map((item: string) => item.trim().replace(/"/g, ''));
        }
        frontmatter[key.trim()] = value;
      }
    });

    const bodyContent = frontmatterMatch[2];

    // Convert markdown to HTML for the editor
    let htmlContent = bodyContent
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
      .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.)/gm, '<p>$1')
      .replace(/(.)\n$/gm, '$1</p>');

    const postData = {
      title: frontmatter.title || '',
      slug: slug,
      content: htmlContent,
      author: frontmatter.author || '',
      authorBio: frontmatter.author_bio || '',
      category: frontmatter.category || '',
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.join(', ') : frontmatter.tags || '',
      metaDescription: frontmatter.description || '',
      focusKeywords: frontmatter.focus_keywords || '',
      canonicalURL: frontmatter.canonical_url || '',
      robotsMeta: frontmatter.robots_meta || 'index,follow',
      ogTitle: frontmatter.og_title || '',
      ogDescription: frontmatter.og_description || '',
      ogImage: frontmatter.og_image || frontmatter.image || '',
      featuredImage: frontmatter.image || '',
      schemaType: frontmatter.schema_type || 'Article',
      publisherName: frontmatter.publisher_name || '',
      publisherLogo: frontmatter.publisher_logo || '',
      publishStatus: frontmatter.draft === true || frontmatter.draft === 'true' ? 'draft' : 'published',
      publishDate: frontmatter.publishDate || '',
      visibility: frontmatter.visibility || 'public'
    };

    return new Response(JSON.stringify({ 
      success: true, 
      post: postData 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error loading post:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to load post: ' + (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};