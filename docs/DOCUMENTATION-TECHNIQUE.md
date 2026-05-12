# Documentation Technique — Alex le Potier

Documentation technique complète du site **alex.lepotier.ovh**. Ce document s'adresse à un développeur reprenant le projet.

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [HTML — Structure des pages](#html--structure-des-pages)
4. [CSS — Système de styles](#css--système-de-styles)
5. [JavaScript — Fonctionnalités](#javascript--fonctionnalités)
6. [SEO et métadonnées](#seo-et-métadonnées)
7. [Hébergement et déploiement](#hébergement-et-déploiement)
8. [Nom de domaine](#nom-de-domaine)
9. [Performance](#performance)
10. [Accessibilité](#accessibilité)
11. [Version anglaise](#version-anglaise)
12. [Points d'attention](#points-dattention)

---

## Vue d'ensemble

| Élément | Détail |
|---------|--------|
| **Type** | Site statique (HTML/CSS/JS vanilla) |
| **Build system** | Aucun |
| **Framework** | Aucun |
| **Dépendances** | Aucune (pas de `package.json`) |
| **Hébergement** | GitHub Pages |
| **Domaine** | alex.lepotier.ovh (CNAME vers GitHub Pages) |
| **Registrar** | OVHcloud |
| **Langue principale** | Français |
| **Version anglaise** | Oui, dans le dossier `en/` |

---

## Architecture

```
/
├── index.html              # Page d'accueil
├── pieces.html             # Galerie
├── apropos.html            # À propos
├── faq.html                # FAQ (avec JSON-LD FAQPage)
├── contact.html            # Contact (Formspree)
├── mentions-legales.html   # Mentions légales
├── cgv.html                # CGV
├── fds.html                # Fiches de données de sécurité (non naviguée)
├── 404.html                # Page 404 custom
├── en/                     # Version anglaise (même structure)
├── css/
│   └── style.css           # Feuille de style unique (~1350 lignes)
├── js/
│   └── main.js             # JS unique (~240 lignes)
├── images/                 # Toutes les images (JPG + WebP)
├── CNAME                   # alex.lepotier.ovh
├── robots.txt              # Allow all
├── sitemap.xml             # 15 URLs (FR + EN)
└── AGENTS.md               # Instructions pour les agents IA
```

### Pas de header/footer partagé

Le header et le footer sont **dupliqués dans chaque fichier HTML**. Il n'y a pas de système de templates, d'includes, ni de SSG. Toute modification du header ou footer doit être reportée manuellement dans **tous les fichiers** (8 pages FR + pages EN).

---

## HTML — Structure des pages

### Template commun à toutes les pages

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Titre — Alex le Potier</title>
  <meta name="description" content="...">
  <link rel="canonical" href="https://alex.lepotier.ovh/page.html">
  <!-- Open Graph -->
  <meta property="og:title" content="...">
  <meta property="og:description" content="...">
  <meta property="og:image" content="https://alex.lepotier.ovh/images/25.jpg">
  <meta property="og:url" content="...">
  <!-- Hreflang -->
  <link rel="alternate" hreflang="fr" href="https://alex.lepotier.ovh/page.html">
  <link rel="alternate" hreflang="en" href="https://alex.lepotier.ovh/en/page.html">
  <!-- Favicon -->
  <link rel="icon" type="image/jpeg" href="images/favicon-32x32.jpg">
  <!-- CSS -->
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header>...</header>
  <main>...</main>
  <footer>...</footer>
  <script src="js/main.js"></script>
</body>
</html>
```

### Pages détaillées

#### `index.html` — Accueil
- **Hero** (`.hero`, 100vh) : image de fond via `style="background-image: url('images/25.jpg')"`, overlay sombre 45%, contenu centré (titre h1, tagline, hero-tag, CTA)
- **Démarche** (`.demarche`) : texte de présentation, grille de 3 arguments (`.arguments-container`), photo étagère (`<picture>` avec WebP), section commandes, CTAs
- **Schema.org** : JSON-LD `LocalBusiness` dans le `<head>`

#### `pieces.html` — Galerie
- 17 images dans `.gallery-grid`
- Chaque image dans un `<a data-lightbox>` contenant un `<picture>` (WebP + JPG)
- Lightbox HTML en bas de page (`#lightbox`)
- Images actuelles (dans l'ordre) : 25, 26, 24, 23, 22, 21, 20, 12, 11, 10, 9, 4, 8, 5, 3, 2, 1

#### `apropos.html` — À propos
- Style éditorial magazine : sections alternées `.editorial-section` / `.editorial-section--alt`
- Citation hero (`.quote-hero`)
- Photo portrait dans `.editorial-image`
- Lien LinkedIn

#### `faq.html` — FAQ
- 10 questions dans `.faq-container` > `.faq-item`
- JSON-LD `FAQPage` dans le `<head>` (doit rester synchronisé avec le contenu HTML)

#### `contact.html` — Contact
- Grille 2 colonnes (`.contact-grid`) : infos à gauche, formulaire à droite
- Formulaire Formspree : `action="https://formspree.io/f/mreakdry"`, méthode POST
- Champs : name, email, subject, message + honeypot `_gotcha` (anti-spam)
- Carte OpenStreetMap en iframe (coordonnées Ancoisne ~50.5633, 2.9875)
- SIRET affiché : `99455629800010`

#### `404.html` — Erreur
- `<meta name="robots" content="noindex">`
- Deux boutons : Accueil et Pièces

---

## CSS — Système de styles

### Fichier unique : `css/style.css` (~1350 lignes)

### Variables CSS (`:root`)

```css
--color-bg: #faf9f7;        /* Fond principal */
--color-bg-alt: #f5f3f0;    /* Fond alterné (sections) */
--color-text: #2c2c2c;      /* Texte principal */
--color-text-light: #666;   /* Texte secondaire */
--color-accent: #7a6548;    /* Couleur accent (boutons, liens) */
--color-border: #e5e2dd;    /* Bordures */
--font-primary: 'Georgia', 'Times New Roman', serif;     /* Titres */
--font-secondary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; /* Corps */
--max-width: 1000px;        /* Largeur max du contenu */
--transition: 0.3s ease;    /* Transition globale */
```

### Organisation du CSS (sections dans l'ordre)

| Section | Description |
|---------|-------------|
| Variables & Reset | Custom properties, box-sizing, body styles |
| Skip Link | Lien d'accessibilité (caché visuellement) |
| Focus Visible | Style de focus personnalisé |
| Typography | Styles de base des textes |
| Layout | `.container`, `.section` |
| Header | Fixé, 70px, backdrop-filter blur |
| Hero | 100vh, background-size cover, overlay |
| CTA Buttons | `.btn`, `.cta`, `.cta-dark` |
| Démarche | Section accueil |
| Commandes | Sous-section accueil |
| CTA Final Minimal | `.cta-final-minimal` |
| Pièces | `.pieces-header`, `.pieces-note` |
| Gallery | Grille 2 colonnes, `nth-child(3n)` pleine largeur |
| Page Header | En-tête commun aux pages intérieures |
| Editorial/About | Sections alternées style magazine |
| FAQ | `.faq-container`, `.faq-item` |
| Contact | Grille 2 colonnes, formulaire |
| Lightbox | Modal plein écran, z-index 1000 |
| Footer | 3 colonnes flex |
| Legal | Styles pages légales |
| FDS | Styles fiches de données |
| Responsive 768px | Tablette/mobile |
| Responsive 480px | Petit mobile |
| Scroll Animations | `.fade-in`, `.is-visible` |

### Breakpoints

| Breakpoint | Cible | Changements clés |
|------------|-------|-------------------|
| `768px` | Tablette | Nav mobile (hamburger), galerie 1 colonne, footer/contact empilés |
| `480px` | Mobile | Typo réduite, arguments en 1 colonne |

### Grille de la galerie

```css
.gallery-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;  /* 2 colonnes */
  gap: 32px;
}

.gallery-item:nth-child(3n) {
  grid-column: 1 / -1;             /* Chaque 3e image = pleine largeur */
  margin-top: 20px;
  margin-bottom: 40px;
}
```

### Header fixe

```css
header {
  position: fixed;
  top: 0;
  width: 100%;
  height: 70px;
  backdrop-filter: blur(10px);
  z-index: 100;
}
```

### Animations au scroll

Les éléments reçoivent la classe `.fade-in` via JS, puis `.is-visible` quand ils entrent dans le viewport. La transition CSS associée gère l'apparition.

---

## JavaScript — Fonctionnalités

### Fichier unique : `js/main.js` (~240 lignes)

Tout est initialisé dans l'événement `DOMContentLoaded`. Trois modules :

### 1. `initMobileMenu()`

- Toggle la classe `.active` sur `.menu-toggle` et `.nav`
- Animation du hamburger via CSS (`.menu-toggle.active span` — rotation des barres)
- Fermeture sur clic lien nav ou touche Escape
- Retour du focus sur le bouton hamburger à la fermeture

### 2. `initLightbox()`

Système complet de visionneuse d'images :

- **Sélection** : tous les éléments `[data-lightbox]`, extraction des URLs via `href`
- **Ouverture** : clic sur une image → affiche la lightbox, bloque le scroll (`body.style.overflow = 'hidden'`), focus sur le bouton fermer
- **Navigation** : boutons prev/next, touches ArrowLeft/ArrowRight
- **Compteur** : élément `.lightbox-counter` ajouté dynamiquement (ex: "3 / 17")
- **Fermeture** : bouton X, clic sur le fond, touche Escape
- **Swipe tactile** : support swipe gauche/droite (seuil 50px)
- **Focus trap** : Tab et Shift+Tab cyclent entre les 3 boutons (fermer, précédent, suivant)
- **Restauration du focus** : retour au lien déclencheur à la fermeture

### 3. `initScrollAnimations()`

- Utilise `IntersectionObserver` (threshold 0.1, rootMargin `0px 0px -40px 0px`)
- Ajoute `.fade-in` aux éléments cibles au chargement
- Ajoute `.is-visible` quand l'élément entre dans le viewport
- **Respecte `prefers-reduced-motion`** : désactivé si l'utilisateur préfère les mouvements réduits
- Éléments ciblés : `.hero-content`, éléments démarche, items galerie, sections éditoriales, items FAQ, éléments contact, `.page-header`

---

## SEO et métadonnées

### Balises présentes sur chaque page

- `<title>` unique par page
- `<meta name="description">` unique par page
- `<link rel="canonical">` avec URL absolue
- Open Graph : `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- `hreflang` : `fr` et `en` avec liens croisés

### Données structurées (JSON-LD)

| Page | Type | Contenu |
|------|------|---------|
| `index.html` | `LocalBusiness` | Nom, adresse, description, URL, image |
| `faq.html` | `FAQPage` | 10 questions/réponses |

### Fichiers SEO

- `robots.txt` : autorise tous les robots, pointe vers le sitemap
- `sitemap.xml` : 15 URLs avec priorités (8 FR + 7 EN). Inclut `fds.html` (non naviguée)

---

## Hébergement et déploiement

### GitHub Pages

- **Dépôt** : `alexchojnacki.github.io` (dépôt utilisateur GitHub Pages)
- **Branche** : `main`
- **Déploiement** : automatique à chaque push sur `main`
- **Délai** : quelques minutes après le push
- **Pas de build** : les fichiers sont servis tels quels

### Workflow de déploiement

```
Modification locale → git add → git commit → git push → GitHub Pages déploie automatiquement
```

Vérification : onglet "Actions" du dépôt GitHub → workflow "pages build and deployment".

---

## Nom de domaine

| Élément | Valeur |
|---------|--------|
| **Domaine** | `lepotier.ovh` |
| **Sous-domaine utilisé** | `alex.lepotier.ovh` |
| **Registrar** | OVHcloud |
| **Configuration** | CNAME pointant vers GitHub Pages |
| **Fichier CNAME** | À la racine du dépôt, contient `alex.lepotier.ovh` |
| **HTTPS** | Géré automatiquement par GitHub Pages (Let's Encrypt) |

> **Important** : ne pas supprimer le fichier `CNAME`, sinon le domaine personnalisé sera déconnecté.

---

## Performance

### Stratégies en place

- **Images WebP** : chaque image existe en JPG + WebP, servie via `<picture>` (WebP prioritaire)
- **Lazy loading** : `loading="lazy"` sur toutes les images de la galerie
- **Pas de framework** : JS vanilla, pas de dépendances externes
- **CSS unique** : un seul fichier CSS, pas de fonts externes
- **Dimensions explicites** : `width` et `height` sur les images (évite le CLS)
- **Backdrop-filter** : utilisé sur le header (peut impacter les performances sur certains appareils)

### Polices

Le site utilise uniquement des **polices système** (pas de Google Fonts ni de fichiers de police) :
- Primaire : Georgia, Times New Roman, serif
- Secondaire : pile système sans-serif (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)

---

## Accessibilité

### Mesures en place

- **Skip link** : lien "Aller au contenu principal" (caché visuellement, visible au focus)
- **Alt text** : toutes les images ont un attribut `alt` descriptif en français
- **ARIA labels** : sur les boutons sans texte visible (hamburger, lightbox)
- **Navigation clavier** : lightbox navigable (Escape, flèches, Tab)
- **Focus trap** : dans la lightbox ouverte
- **Focus visible** : styles personnalisés pour `:focus-visible`
- **Reduced motion** : les animations au scroll sont désactivées si `prefers-reduced-motion` est activé
- **Liens externes** : `target="_blank" rel="noopener"`

---

## Version anglaise

Le dossier `en/` contient une traduction anglaise du site avec la même structure. Les pages FR et EN sont liées via :
- Les attributs `hreflang` dans le `<head>`
- Un sélecteur de langue dans le header (lien FR/EN)

Le sitemap inclut les URLs anglaises avec des priorités légèrement inférieures.

> **Note** : les pages `mentions-legales.html` et `cgv.html` n'ont pas de sélecteur de langue.

---

## Points d'attention

### Incohérences connues

1. **`--color-accent`** : la valeur dans `style.css` est `#7a6548`, mais `AGENTS.md` indique `#8b7355`. La valeur réelle est celle du CSS.
2. **Image `7.jpg/7.webp`** : existe dans `images/` mais n'est pas utilisée dans la galerie.
3. **`fds.html`** : référencée dans `mentions-legales.html` et `sitemap.xml` mais absente de la navigation principale.
4. **Pages légales** : `mentions-legales.html` et `cgv.html` n'ont pas le sélecteur de langue FR/EN.
5. **`letter_A.*`** : trois fichiers (SVG, PNG, PNG fiche) dans `images/` mais non référencés dans le HTML.
6. **`hero.jpg/hero.webp`** : images dans `images/` mais non utilisées (le hero utilise `25.jpg/25.webp`).

### Duplication du header/footer

C'est le principal risque de maintenance. À chaque modification du header ou du footer, il faut mettre à jour **tous les fichiers HTML** (FR + EN). Une amélioration possible serait d'introduire un SSG minimal (Eleventy, par exemple) ou des Web Components pour factoriser ces éléments.

### Formspree

Le plan gratuit de Formspree est limité en nombre de soumissions par mois. Vérifier régulièrement que la limite n'est pas atteinte, surtout en période de forte activité.

### Domaine

Le domaine `lepotier.ovh` doit être renouvelé régulièrement chez OVHcloud. Sans renouvellement, le site restera accessible via `alexchojnacki.github.io` mais le domaine personnalisé cessera de fonctionner.
