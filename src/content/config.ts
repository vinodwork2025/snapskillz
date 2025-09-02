import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    author: z.string().optional(),
    publishDate: z.date().optional(),
    category: z.string().optional(), // Made flexible to accept any category
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    image: z.string().optional(),
    readTime: z.number().optional(), // in minutes
    draft: z.boolean().optional(),
    // Additional fields for admin editor
    focus_keywords: z.string().optional(),
    canonical_url: z.string().optional(),
    robots_meta: z.string().optional(),
    og_title: z.string().optional(),
    og_description: z.string().optional(),
    og_image: z.string().optional(),
    schema_type: z.string().optional(),
    publisher_name: z.string().optional(),
    publisher_logo: z.string().optional(),
    visibility: z.string().optional(),
  }),
});

export const collections = {
  blog,
};