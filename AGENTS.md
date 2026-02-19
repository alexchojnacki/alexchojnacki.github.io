# AGENTS.md

Guidelines for agentic coding agents working in this repository.

## Project Overview

**Alex le Potier** - A static portfolio website for an artisan potter.
- **Type**: Static HTML/CSS/JS website (no build system)
- **Hosting**: GitHub Pages at alex.lepotier.ovh
- **Language**: French (content and comments)

## Project Structure

```
/
├── index.html          # Homepage - introduction and philosophy
├── portfolio.html      # Gallery page with lightbox
├── contact.html        # Contact form (Formspree integration)
├── css/
│   └── style.css       # All styles (single file, ~610 lines)
├── js/
│   └── main.js         # Mobile menu + lightbox functionality
├── images/
│   ├── logo_nobg.png   # Site logo
│   ├── logo.jpg        # Logo variant
│   └── [1-12].jpg      # Portfolio images
└── CNAME               # Custom domain configuration
```

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

### Validation
```bash
# Validate HTML (if html-validate installed)
npx html-validate *.html

# Check for broken links (if linkinator installed)
npx linkinator http://localhost:8000
```

### No Tests
This project has no automated tests. Verify changes manually in browser.

## Code Style Guidelines

### HTML
- Use HTML5 doctype and semantic elements (`<header>`, `<main>`, `<footer>`, `<section>`)
- Set `lang="fr"` on root `<html>` element
- Include meta viewport and description tags
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
- Follow existing variable naming: `--color-*`, `--font-*`, `--spacing-*`
- Mobile-first not required; use `@media (max-width: ...)` for responsive
- Breakpoints: 768px (tablet), 480px (mobile)
- Use `var(--transition)` for consistent animations

### CSS Variables (reference)
```css
--color-bg: #faf9f7;
--color-bg-alt: #f5f3f0;
--color-text: #2c2c2c;
--color-text-light: #666;
--color-accent: #8b7355;
--color-border: #e5e2dd;
--font-primary: 'Georgia', serif;
--font-secondary: -apple-system, sans-serif;
--spacing-xs/sm/md/lg/xl: 0.5rem to 6rem;
```

### JavaScript
- Vanilla JS only (no frameworks or libraries)
- Use ES6+ syntax (const/let, arrow functions, template literals)
- 2 spaces for indentation
- Single quotes for strings
- JSDoc-style comments for functions:
  ```javascript
  /**
   * Brief description
   */
  function functionName() { }
  ```
- Guard clauses for early returns: `if (!element) return;`
- Use `DOMContentLoaded` event for initialization
- camelCase for functions and variables

### Naming Conventions
- **Files**: lowercase, hyphens if needed (`style.css`, `main.js`)
- **CSS classes**: lowercase with hyphens (BEM-like): `.gallery-item`, `.nav-link`
- **JS functions**: camelCase (`initMobileMenu`, `showImage`)
- **JS variables**: camelCase (`currentIndex`, `galleryItems`)
- **IDs**: lowercase with hyphens (`lightbox-image`)

### Accessibility
- All images must have `alt` attributes
- Interactive elements need `aria-label` when text not visible
- Keyboard navigation supported (Escape, Arrow keys for lightbox)
- Focus states should be visible
- Color contrast should meet WCAG AA standards

## Component Patterns

### Header (repeated on all pages)
- Fixed position with logo, nav, Instagram link, mobile toggle
- Update `active` class on `.nav-link` for current page

### Footer (repeated on all pages)
- Copyright year and Instagram link
- Update year manually when needed

### Adding New Gallery Images
1. Add image file to `images/` folder (numbered sequentially)
2. Add gallery item in `portfolio.html`:
   ```html
   <a href="images/N.jpg" class="gallery-item" data-lightbox>
     <img src="images/N.jpg" alt="Création céramique N" loading="lazy">
   </a>
   ```

### Adding New Pages
1. Copy structure from existing page (header/footer)
2. Update `<title>` and `<meta name="description">`
3. Set correct `active` class on nav link
4. Add link in navigation on all pages

## Git Conventions

### Commit Messages
- Keep messages concise and descriptive
- Use imperative mood: "Add feature" not "Added feature"
- Examples from history: "CNAME ADD", "alexlepotier V1"

### Workflow
- Single `main` branch
- Push directly to main (deploys via GitHub Pages)
- No pull request workflow currently

## Important Notes

- **No build step**: Changes are live immediately after push
- **No dependencies**: No package.json, no node_modules
- **Form handling**: Contact form uses Formspree (external service)
- **Images**: Optimize before adding (reasonable file sizes for web)
- **French content**: All user-facing text should be in French
- **Design**: Minimalist, artisanal aesthetic - earthy tones, serif fonts

## Browser Support

Target modern browsers (last 2 versions):
- Chrome, Firefox, Safari, Edge
- Mobile Safari, Chrome for Android
- CSS features used: Grid, Flexbox, Custom Properties, clamp()
