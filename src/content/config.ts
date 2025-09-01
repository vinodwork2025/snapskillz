import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    publishDate: z.date(),
    category: z.enum(['programming', 'design', 'data-science', 'business', 'technology']),
    tags: z.array(z.string()),
    featured: z.boolean().optional(),
    image: z.string().optional(),
    readTime: z.number().optional(), // in minutes
  }),
});

export const collections = {
  blog,
};