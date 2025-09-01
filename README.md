
# Snapskillz — Cloudflare Pages Starter

This is a ready-to-deploy static site for Cloudflare Pages. Use it as your base, then upgrade to Astro/Next.js later.

## 🚀 Deploy Steps

1) **Create GitHub Repo**
- Create a new repo named `snapskillz-site`.
- Download this starter and upload files, or push via Git.

2) **Connect to Cloudflare Pages**
- Cloudflare Dashboard → Pages → Create Project → Connect to Git → select your repo.
- Framework preset: **None** (static site). Build command: **(leave empty)**. Output directory: **/**.

3) **Set Custom Domain**
- In your Pages project → Custom domains → add `snapskillz.com` (or use `pages.dev` while testing).

4) **Add Beehiiv Newsletter**
- Replace `REPLACE_WITH_BEEHIIV_FORM_UID` in `/index.html` and footer.
- If you prefer a link, edit the `noscript` link to your Beehiiv subscribe page.

5) **Add Products**
- Edit `/products.html` and link your Gumroad/LemonSqueezy checkout URLs.

6) **Add Blog Posts**
- Create HTML files under `/blog/` (e.g., `/blog/aws-interview-questions-2025.html`).
- Remember to add `<title>` and `<meta name="description">` to each post.

7) **Basic SEO**
- Update `sitemap.xml` when you add pages.
- Submit your domain in Google Search Console and Bing Webmaster Tools.

8) **Upgrade Path (Optional)**
- Migrate to **Astro** or **Next.js** when you want Markdown posts, layouts, and automatic sitemaps.
