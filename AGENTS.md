# AGENTS.md

Guidelines for agentic coding agents working in this repository.

## Project Overview

**Alex le Potier** - A static portfolio website for an artisan potter.
- **Type**: Static HTML/CSS/JS website (no build system)
- **Hosting**: GitHub Pages at alex.lepotier.ovh
- **Language**: French (content and comments)
- **Design**: V2 - Minimalist premium style with full-screen hero

## Project Structure

```
/
├── index.html          # Homepage - hero with background image + signature section
├── pieces.html         # Gallery page with asymmetric grid + lightbox
├── apropos.html        # About page (editorial style with alternating sections)
├── faq.html            # FAQ page (10 questions/answers)
├── contact.html        # Contact form (Formspree integration) + FAQ link
├── mentions-legales.html # Legal mentions
├── cgv.html            # Terms and conditions
├── 404.html            # Custom 404 page
├── css/
│   └── style.css       # All styles (single file, ~880 lines)
├── js/
│   └── main.js         # Mobile menu + lightbox + swipe support
├── images/
│   ├── logo_nobg.png   # Site logo (trimmed, no background)
│   ├── logo_nobg_backup.png # Backup of original logo
│   ├── alex.jpg        # Profile photo
│   ├── hero.jpg        # Hero background (alternative)
│   ├── 25.jpg          # Current hero background
│   ├── 26.jpg          # Planche image
│   └── [1-26].jpg      # Portfolio images
├── robots.txt          # SEO robots file
├── sitemap.xml         # SEO sitemap
└── CNAME               # Custom domain configuration
```

## Current Design (V2)

### Homepage Structure
1. **Hero** (100vh) - Full-screen with background image (25.jpg), centered content
   - Title "Alex le Potier"
   - Tagline "Ce qui est fait lentement reste."
   - Hero tag "Grès tourné à la main"
   - CTA button "Voir les pièces"
2. **Signature section** - "Grès tourné à la main — pièces uniques" + "En savoir plus" button
3. **Footer** - Logo, name, tagline, contact link, legal links, Instagram

### Gallery (pieces.html)
- Asymmetric grid: 2 columns, every 3rd image spans full width
- Gap: 32px, margin-top: 20px on wide images, margin-bottom: 40px
- Lightbox with keyboard navigation and swipe support on mobile

### Footer (all pages)
- Contains logo (40px height on desktop, centered on mobile)
- Three columns: brand info, contact link, legal links + social

## Development Commands

This is a static site with no build process or package manager.

### Local Development
```bash
# Using Python (recommended)
python3 -m http.server 8000

# Using PHP
php -S localhost:8000

# Using Node.js (if npx available)
npx serve .
```

Then open http://localhost:8000 in a browser.

### Image Optimization
```bash
# Convert and optimize images with ImageMagick
convert source.png -quality 85 destination.jpg

# Trim transparent borders from logo
convert logo.png -trim +repage logo.png

# Check image dimensions
identify image.jpg
```

### No Tests
This project has no automated tests. Verify changes manually in browser.

## Code Style Guidelines

### HTML
- Use HTML5 doctype and semantic elements (`<header>`, `<main>`, `<footer>`, `<section>`)
- Set `lang="fr"` on root `<html>` element
- Include meta viewport and description tags
- Include Open Graph meta tags for social sharing
- Include canonical URL
- Use 2 spaces for indentation
- Add `loading="lazy"` on gallery images
- Include ARIA labels for accessibility (`aria-label` on buttons/links)
- External links: use `target="_blank" rel="noopener"`

### CSS
- Single file: `css/style.css`
- Use CSS custom properties (variables) defined in `:root`
- Section comments with dashed separators:
  ```css
  /* --------------------------------------------------------------------------
     Section Name
     -------------------------------------------------------------------------- */
  ```
- Follow existing variable naming: `--color-*`, `--font-*`, `--max-width`
- Breakpoints: 768px (tablet), 480px (mobile)
- Use `var(--transition)` for consistent animations
- Global transition: `* { transition: all 0.25s ease; }`

### CSS Variables (reference)
```css
--color-bg: #faf9f7;
--color-bg-alt: #f5f3f0;
--color-text: #2c2c2c;
--color-text-light: #666;
--color-accent: #8b7355;
--color-border: #e5e2dd;
--font-primary: 'Georgia', 'Times New Roman', serif;
--font-secondary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--max-width: 1000px;
--transition: 0.3s ease;
```

### Typography
- Body: font-weight 300
- H1: 76px on desktop, letter-spacing -1.5px, line-height 1.02
- H1 mobile (768px): 42px
- H1 small mobile (480px): 28px

### JavaScript
- Vanilla JS only (no frameworks or libraries)
- Use ES6+ syntax (const/let, arrow functions, template literals)
- 2 spaces for indentation
- Single quotes for strings
- JSDoc-style comments for functions
- Guard clauses for early returns: `if (!element) return;`
- Use `DOMContentLoaded` event for initialization
- camelCase for functions and variables

### Naming Conventions
- **Files**: lowercase, hyphens if needed (`style.css`, `main.js`)
- **CSS classes**: lowercase with hyphens (BEM-like): `.gallery-item`, `.nav-link`, `.hero-content`
- **JS functions**: camelCase (`initMobileMenu`, `showImage`)
- **JS variables**: camelCase (`currentIndex`, `galleryItems`)
- **IDs**: lowercase with hyphens (`lightbox-image`)

### Accessibility
- All images must have `alt` attributes (descriptive, in French)
- Interactive elements need `aria-label` when text not visible
- Keyboard navigation supported (Escape, Arrow keys for lightbox)
- Focus states should be visible
- Color contrast should meet WCAG AA standards

## Component Patterns

### Header (repeated on all pages)
- Fixed position with logo, nav, mobile toggle
- Logo: 45px height, margin-bottom -8px to compensate for logo spacing
- Update `active` class on `.nav-link` for current page
- Navigation: Accueil, Pièces, À propos, FAQ, Contact, Instagram icon

### Footer (repeated on all pages)
- Logo (40px height), name, tagline
- Contact link
- Legal links (Mentions légales, CGV) + Instagram icon
- Copyright: © 2026 Alexandre Chojnacki
- On mobile: all centered, logo with `margin: 0 auto`

### Adding New Gallery Images
1. Add image file to `images/` folder
2. Optimize: `convert source.jpg -quality 85 images/N.jpg`
3. Add gallery item in `pieces.html`:
   ```html
   <a href="images/N.jpg" class="gallery-item" data-lightbox>
     <img src="images/N.jpg" alt="Description en français" loading="lazy">
   </a>
   ```
4. Note: Every 3rd image (nth-child(3n)) spans 2 columns

### Adding New Pages
1. Copy structure from existing page (header/footer with logo)
2. Update `<title>` and `<meta name="description">`
3. Update Open Graph meta tags
4. Add canonical URL
5. Set correct `active` class on nav link
6. Add link in navigation on all pages

## Git Conventions

### Commit Messages
- Keep messages concise and descriptive in French or English
- Use imperative mood: "Add feature" not "Added feature"
- Examples: "Logo: ajout footer, centrage header", "Mobile: centrage logo footer"

### Workflow
- Single `main` branch
- Push directly to main (deploys via GitHub Pages)
- No pull request workflow currently

## Important Notes

- **No build step**: Changes are live immediately after push
- **No dependencies**: No package.json, no node_modules
- **Form handling**: Contact form uses Formspree (external service)
- **Images**: Optimize before adding (target < 500KB for portfolio, < 250KB for hero)
- **Hero image**: Ideal dimensions 1920x1080 or 1536x1024, ratio 16:9 or 3:2
- **French content**: All user-facing text should be in French
- **Design**: Minimalist, premium, artisanal aesthetic - earthy tones, serif fonts

## Browser Support

Target modern browsers (last 2 versions):
- Chrome, Firefox, Safari, Edge
- Mobile Safari, Chrome for Android
- CSS features used: Grid, Flexbox, Custom Properties, clamp()
