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
│   └── style.css       # Styles du site public (~1440 lignes)
│   └── emaux.css       # Styles de l'outil privé emaux.html, séparés à dessein
├── fonts/
│   ├── newsreader-roman.woff2   # Newsreader variable 200-800, opsz pinned (OFL)
│   ├── newsreader-italic.woff2  # Newsreader italic variable 200-800 (OFL)
│   └── OFL.txt         # SIL Open Font License 1.1 (required with the font files)
├── js/
│   └── main.js         # Mobile menu + lightbox + swipe support
├── images/
│   ├── logo_nobg.png   # Site logo (trimmed, no background)
│   ├── logo_nobg_backup.png # Backup of original logo
│   ├── alex.jpg        # Profile photo (À propos)
│   ├── banniere.jpg    # Bannière d'ouverture de l'accueil (16:9, sans lettrage)
│   └── [1-35].jpg      # Portfolio images (+ variante .webp pour chacune)
│                       # Les sources lourdes (*.JPEG, *.png) ne sont pas servies
├── robots.txt          # SEO robots file
├── sitemap.xml         # SEO sitemap
└── CNAME               # Custom domain configuration
```

## Current Design (V2)

### Homepage Structure
1. **Ouverture** - Une photo (4.jpg, l'étagère) en `<img>` plein écran sous
   l'en-tête, `calc(100vh - 70px)`, **aucun texte par-dessus**. C'est un vrai
   `<img>` et non un background : alt lisible et meilleur LCP (`fetchpriority`).
2. **Bande éditoriale** - h1 = la signature « Ce qui est fait lentement reste. »
   (le nom vit dans l'en-tête, le `<title>` et le JSON-LD), + sur-titre en
   capitales. Aligné à gauche sur `.container-wide`.
3. **Triptyque** - Trois pièces au format carré (27, 20, 26) liées vers la
   galerie, puis « Voir toutes les pièces → ». Grille `.opening-grid`, une
   colonne sous 768px.
4. **Section démarche** - texte, arguments, photo d'étagère, commandes
5. **Footer** - Logo, name, tagline, contact link, legal links, Instagram

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
- Un seul fichier pour le site public : `css/style.css` (`emaux.css` ne sert qu'à l'outil privé)
- Use CSS custom properties (variables) defined in `:root`
- Section comments with dashed separators:
  ```css
  /* --------------------------------------------------------------------------
     Section Name
     -------------------------------------------------------------------------- */
  ```
- Follow existing variable naming: `--color-*`, `--font-*`, `--max-width`
- Breakpoints: 768px (tablet), 480px (mobile)
- `@media (prefers-reduced-motion: reduce)` neutralise l'animation `.fade-in`
  pour les utilisateurs qui demandent moins de mouvement — à préserver.
- Use `var(--transition)` for consistent animations
- **Pas de transition globale.** Il n'existe aucune règle `* { transition: ... }` :
  ce serait une charge inutile pour le navigateur à chaque survol et chaque
  scroll. Seuls quatre sélecteurs précis portent `transition: all
  var(--transition)` — le bouton CTA, la lightbox, les liens de fiches
  techniques et le menu mobile déplié — parce qu'ils animent plusieurs
  propriétés à la fois (opacity + visibility, ou transform + opacity).
  Partout ailleurs, nommer la propriété animée.

### CSS Variables (reference)
```css
--color-bg: #faf9f7;
--color-bg-alt: #f5f3f0;
--color-text: #2c2c2c;
--color-text-light: #666;
--color-accent: #7a6548;
--color-border: #e5e2dd;
--font-primary: 'Newsreader', Georgia, 'Times New Roman', serif;
--font-secondary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--max-width: 1000px;
--max-width-wide: 1320px;  /* galerie uniquement */
--transition: 0.3s ease;
```

### Typography
- Serif: Newsreader, auto-hébergée (`fonts/`, woff2 variable), déclarée en `@font-face`
  en tête de `style.css`. Ne pas passer par Google Fonts : le site n'a aucune
  dépendance externe. Chaque page précharge le roman via `<link rel="preload">`.
- Graisses disponibles : 200 à 800, romain et italique (vraies italiques dessinées)
- Body: font-weight 350
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
- Navigation: Accueil, Pièces, À propos, Contact, FAQ, icône Instagram, sélecteur FR/EN

### Footer (repeated on all pages)
- Logo (40px height), name, tagline
- Contact link
- Legal links (Mentions légales, CGV) + Instagram icon
- Copyright: © 2026 Alexandre Chojnacki
- On mobile: all centered, logo with `margin: 0 auto`

### Adding New Gallery Images
1. Add image file to `images/` folder
2. Optimize, and generate the WebP sibling (cible < 500 Ko) :
   ```bash
   convert source.JPEG -resize '1200x1200>' -quality 86 -strip images/N.jpg
   convert source.JPEG -resize '1200x1200>' -quality 82 -define webp:method=6 images/N.webp
   ```
3. Add a `<figure class="gallery-item">` in `pieces.html` **and** `en/pieces.html`,
   with `<picture>`, `width`/`height`, `loading="lazy"`, un `alt` et une
   `<figcaption>` rédigée.
4. **Mise en page** : grille régulière de trois colonnes, toutes les vignettes
   au même gabarit carré (`aspect-ratio: 1/1`, `object-fit: cover`). Plus de
   pleine largeur, plus d'appariement par format, plus de `nth-child(3n)` :
   l'ordre des pièces est libre, seul compte le contenu. Le cadrage d'origine
   reste intact dans la lightbox. Deux colonnes sous 768 px, une sous 480 px.
5. `sizes` : `420px` pour toutes les vignettes.
6. **Légende** : une `<span class="caption-spec">` (l'étiquette, en capitales :
   objet · terre · émail, séparés par des points médians) suivie d'une
   `<span class="caption-note">` (une seule phrase, propre à cette pièce).
   Ne pas nommer les références fournisseur des terres : « grès blanc pyrité »,
   « grès de Saint-Amand », pas les codes.

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
