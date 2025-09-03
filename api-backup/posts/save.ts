import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const postData = await request.json();
    
    // Validate required fields
    if (!postData.title || !postData.content || !postData.author) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: title, content, or author' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate slug if not provided
    const slug = postData.slug || postData.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create markdown content with frontmatter
    const publishDate = new Date().toISOString().split('T')[0];
    const frontmatter = `---
title: "${postData.title}"
description: "${postData.metaDescription || ''}"
author: "${postData.author}"
publishDate: ${publishDate}
category: "${postData.category || 'technology'}"
tags: [${postData.tags ? postData.tags.split(',').map((tag: string) => `"${tag.trim()}"`).join(', ') : ''}]
featured: false
image: "${postData.featuredImage || ''}"
readTime: ${Math.ceil(postData.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200)}
draft: ${postData.status === 'draft'}
focus_keywords: "${postData.focusKeywords || ''}"
canonical_url: "${postData.canonicalURL || ''}"
robots_meta: "${postData.robotsMeta || 'index,follow'}"
og_title: "${postData.ogTitle || ''}"
og_description: "${postData.ogDescription || ''}"
og_image: "${postData.ogImage || ''}"
schema_type: "${postData.schemaType || 'Article'}"
publisher_name: "${postData.publisherName || ''}"
publisher_logo: "${postData.publisherLogo || ''}"
visibility: "${postData.visibility || 'public'}"
---

`;

    // Convert HTML content to markdown with better handling for embedded content
    let markdownContent = postData.content
      // Preserve embedded content divs
      .replace(/<div class="embedded-content"[^>]*>([\s\S]*?)<\/div>/g, (match, content) => {
        return '\n\n<!-- EMBEDDED_CONTENT -->\n' + content + '\n<!-- /EMBEDDED_CONTENT -->\n\n';
      })
      // Convert basic HTML to markdown
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
      .replace(/<h4>(.*?)<\/h4>/g, '#### $1\n\n')
      .replace(/<h5>(.*?)<\/h5>/g, '##### $1\n\n')
      .replace(/<h6>(.*?)<\/h6>/g, '###### $1\n\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gs, (match, content) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/gs, '- $1\n');
      })
      .replace(/<ol[^>]*>(.*?)<\/ol>/gs, (match, content) => {
        let counter = 1;
        return content.replace(/<li[^>]*>(.*?)<\/li>/gs, () => `${counter++}. $1\n`);
      })
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gs, (match, content) => {
        return content.replace(/^/gm, '> ');
      })
      .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/g, '[$2]($1)')
      .replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/g, '![$2]($1)')
      .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/g, '![]($1)')
      .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
      .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gs, '```\n$1\n```')
      .replace(/<p[^>]*>(.*?)<\/p>/gs, '$1\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      // Clean up remaining HTML tags except embedded content
      .replace(/<(?!\/?(EMBEDDED_CONTENT))[^>]*>/g, '');

    // Clean up extra whitespace
    markdownContent = markdownContent.replace(/\n{3,}/g, '\n\n').trim();

    const fullContent = frontmatter + markdownContent;

    // Ensure content directory exists
    const contentDir = join(process.cwd(), 'src', 'content', 'blog');
    if (!existsSync(contentDir)) {
      await mkdir(contentDir, { recursive: true });
    }

    // Write file
    const filename = `${slug}.md`;
    const filepath = join(contentDir, filename);
    await writeFile(filepath, fullContent, 'utf8');

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Post ${postData.status === 'draft' ? 'saved as draft' : 'published'} successfully!`,
      slug: slug,
      filepath: `src/content/blog/${filename}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error saving post:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to save post: ' + (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};