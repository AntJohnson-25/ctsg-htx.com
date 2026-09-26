# CTSG Website

Static business website for ctsg-htx.com.

## Site files

- `index.html` contains the page content, SEO metadata, structured data, and contact UI.
- `styles.css` contains responsive layout and visual styling.
- `script.js` handles the opportunity tabs and illustration pins, keyboard navigation, mobile menu, and current footer year.
- `assets/` contains the neighborhood illustration. The logo and portrait are kept at the repository root.
- `robots.txt` and `sitemap.xml` provide crawler guidance and the canonical site URL.

The site is a static front end. The interactions are browser-side UI behavior; this repository does not provide a backend for the contact form.

## Preview locally

From the repository root, run `python -m http.server 8000` and open `http://localhost:8000`.

## Publishing

Pushes to `main` trigger `.github/workflows/pages.yml`, which publishes the repository root to GitHub Pages. `CNAME` configures the custom domain. Keep operational files out of the root because the workflow publishes the whole repository.
