# 🚀 SnapSkillz - AI-Powered Learning Platform

SnapSkillz is a comprehensive AI-powered learning platform that provides personalized quizzes, mock interviews, and study resources to help learners master their skills effectively.

## ✨ Features

- 🎯 **AI Quiz Generator** - Personalized skill assessments across multiple domains
- 🎤 **Mock Interview System** - Realistic interview scenarios with instant feedback
- 📚 **Study Resources Library** - Curated learning materials and tutorials
- 📝 **Professional Blog** - Tech insights and learning guides
- 🎨 **Modern Design System** - Consistent, responsive UI components
- 📱 **Mobile-First Design** - Optimized for all device sizes
- ♿ **Accessibility** - WCAG compliant with keyboard navigation
- 🌙 **Dark Mode Ready** - Theme switching capabilities

## 🛠️ Technology Stack

- **Framework**: [Astro](https://astro.build) - Static site generator
- **Styling**: [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- **Content**: Markdown with type-safe collections
- **Animations**: CSS transitions with Intersection Observer
- **Deployment**: Ready for Vercel, Netlify, or Cloudflare Pages

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/vinodwork2025/snapskillz.git
cd snapskillz

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:4321` to see your SnapSkillz platform in action!

## 📁 Project Structure

```
snapskillz/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Header.astro    # Navigation with glass morphism
│   │   ├── Footer.astro    # Site footer with links
│   │   └── DesignSystem.astro  # Comprehensive design system
│   ├── content/            # Content collections
│   │   └── blog/           # Blog posts in Markdown
│   ├── layouts/            # Page layouts
│   │   ├── Layout.astro    # Base layout with SEO
│   │   └── BlogPost.astro  # Blog post layout
│   └── pages/              # Route pages
│       ├── index.astro     # Homepage with hero section
│       ├── about.astro     # About page
│       ├── features.astro  # Features showcase
│       ├── quiz.astro      # AI quiz interface
│       ├── interviews.astro # Mock interview system
│       ├── resources.astro # Study resources
│       └── blog/           # Blog pages
├── tailwind.config.mjs     # Tailwind configuration
└── astro.config.mjs        # Astro configuration
```

## 🧞 Available Commands

All commands are run from the root of the project:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 🌐 Deployment

### Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Vercel will automatically detect Astro and deploy

### Deploy to Netlify
1. Connect your repository to [Netlify](https://netlify.com)
2. Build settings: `npm run build`, Publish directory: `dist`

### Deploy to Cloudflare Pages
1. Connect your repository to Cloudflare Pages
2. Framework preset: Astro
3. Build command: `npm run build`
4. Output directory: `dist`

## 🎨 Design System

SnapSkillz includes a comprehensive design system with:

- **Components**: Buttons, cards, sections, badges
- **Typography**: Responsive text scales and font loading
- **Colors**: Consistent color palette with CSS custom properties
- **Animations**: Scroll-triggered effects and hover states
- **Layout**: Container systems and section utilities

## 📝 Content Management

- **Blog Posts**: Write in Markdown with frontmatter
- **Type Safety**: Zod schemas for content validation
- **SEO**: Automatic meta tags and Open Graph images
- **RSS**: Generated RSS feed for blog posts

## 🔧 Customization

### Adding New Pages
1. Create a new `.astro` file in `src/pages/`
2. Use existing layouts and components
3. Follow the design system patterns

### Modifying Styles
1. Edit `src/components/DesignSystem.astro` for global styles
2. Use Tailwind classes for component-specific styling
3. Follow mobile-first responsive design principles

### Adding Blog Posts
1. Create a new Markdown file in `src/content/blog/`
2. Add required frontmatter (title, description, date, etc.)
3. Write content using Markdown syntax

## 📊 SEO Features

- Meta tags and Open Graph images
- Structured data markup
- XML sitemap generation
- Robots.txt configuration
- Performance optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **Live Site**: [snapskillz.vercel.app](https://snapskillz.vercel.app) (when deployed)
- **Documentation**: [Astro Docs](https://docs.astro.build)
- **Support**: Create an issue in this repository

---

Built with ❤️ using [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com)