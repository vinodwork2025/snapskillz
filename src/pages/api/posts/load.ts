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

    // Convert markdown to HTML for the editor with better handling for embedded content
    let htmlContent = bodyContent
      // Handle embedded content first
      .replace(/<!-- EMBEDDED_CONTENT -->\n([\s\S]*?)\n<!-- \/EMBEDDED_CONTENT -->/g, (match, content) => {
        return `<div class="embedded-content" style="margin: 20px 0; padding: 10px; border: 1px dashed #e5e7eb; border-radius: 8px;">${content}</div>`;
      })
      // Convert basic markdown to HTML
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
      .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1">')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // Handle paragraphs last to avoid breaking embedded content
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[^>]+>)(.+)$/gm, '<p>$1</p>')
      // Clean up empty paragraphs and fix nested tags
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<[^>]+>.*<\/[^>]+>)<\/p>/g, '$1')
      .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/g, '');

    // Clean up extra whitespace
    htmlContent = htmlContent.replace(/\n{2,}/g, '\n').trim();

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