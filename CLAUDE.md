# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server at localhost:4321 |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run astro` | Run Astro CLI commands |

## Architecture Overview

**SnapSkillz** is an AI-powered learning platform built with Astro, featuring:

### Technology Stack
- **Framework**: Astro 5.13+ with React integration
- **Styling**: Tailwind CSS with custom design system
- **TypeScript**: Strict configuration with Astro's TypeScript support
- **Deployment**: Configured for Vercel, Netlify, and Cloudflare Pages

### Project Structure

```
snapskillz/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── DesignSystem.astro    # Global styles and design tokens
│   │   ├── Header.astro          # Navigation with glass morphism
│   │   ├── Footer.astro          # Site footer
│   │   └── FloatingElements.astro # Animated background elements
│   ├── layouts/             # Page layouts
│   │   ├── Layout.astro          # Base layout with SEO meta tags
│   │   └── BlogPost.astro        # Blog post layout
│   ├── pages/               # Route-based pages
│   │   ├── index.astro           # Homepage with hero section
│   │   ├── features.astro        # Features showcase
│   │   ├── quiz.astro            # AI quiz interface
│   │   ├── interviews.astro      # Mock interview system
│   │   ├── resources.astro       # Study resources
│   │   └── blog/                 # Blog pages and dynamic routes
│   └── content/             # Content collections
│       └── blog/            # Markdown blog posts
├── public/                  # Static assets
├── tailwind.config.mjs      # Tailwind configuration with custom animations
└── astro.config.mjs         # Astro + React + Tailwind integration
```

### Design System

The project uses a comprehensive design system defined in `src/components/DesignSystem.astro`:

- **Custom Animations**: Fade-in, slide-up, float, glow, gradient transitions
- **Glass Morphism**: Backdrop blur effects and glassmorphic cards
- **Color Scheme**: Blue/purple gradient theme with CSS custom properties  
- **Typography**: Inter font family with responsive scales
- **Components**: Buttons, cards, sections, badges with consistent styling

### Key Components

- **Header.astro**: Navigation with mobile-responsive menu and glass morphism styling
- **Footer.astro**: Multi-column footer with social links and sitemap
- **Layout.astro**: Base layout with SEO meta tags, Open Graph, and Twitter cards
- **DesignSystem.astro**: Contains all global styles, CSS variables, and utility classes

### Content Management

- **Blog System**: Markdown-based with frontmatter for metadata
- **Type Safety**: Uses Astro's content collections for type-safe content
- **SEO Optimized**: Automatic meta tags, sitemap.xml, and robots.txt generation

### Styling Conventions

- **Mobile-First**: All responsive design follows mobile-first approach
- **Utility-First**: Primarily uses Tailwind utility classes
- **Custom Properties**: CSS variables for theme colors and consistent spacing
- **Animation Classes**: Custom Tailwind animation utilities for interactive elements

### Development Notes

- **TypeScript**: Uses Astro's strict TypeScript configuration
- **Hot Reload**: Development server supports hot module replacement
- **Static Generation**: All pages are statically generated at build time
- **Asset Optimization**: Automatic optimization for images and fonts

### Deployment Configuration

- **Netlify**: Configured with `netlify.toml` for build settings and redirects
- **Vercel**: Ready for zero-config deployment with `vercel.json`
- **Build Output**: Generates static files to `dist/` directory