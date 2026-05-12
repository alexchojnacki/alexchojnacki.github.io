# Guide Utilisateur — Alex le Potier

Ce guide explique comment gérer et modifier le contenu du site **alex.lepotier.ovh** sans connaissances techniques avancées. Le site est un ensemble de fichiers HTML/CSS/JS statiques, hébergé sur GitHub Pages.

---

## Table des matières

1. [Prérequis](#prérequis)
2. [Structure du site](#structure-du-site)
3. [Lancer le site en local](#lancer-le-site-en-local)
4. [Modifier du texte](#modifier-du-texte)
5. [Gérer les images](#gérer-les-images)
6. [Gérer la galerie (pieces.html)](#gérer-la-galerie)
7. [Modifier la page d'accueil](#modifier-la-page-daccueil)
8. [Modifier la page À propos](#modifier-la-page-à-propos)
9. [Modifier la FAQ](#modifier-la-faq)
10. [Modifier la page Contact](#modifier-la-page-contact)
11. [Modifier les pages légales](#modifier-les-pages-légales)
12. [Modifier le header et le footer](#modifier-le-header-et-le-footer)
13. [Gérer le formulaire de contact](#gérer-le-formulaire-de-contact)
14. [Publier les modifications](#publier-les-modifications)
15. [Services externes](#services-externes)

---

## Prérequis

- Un **éditeur de texte** : [VS Code](https://code.visualstudio.com/) (recommandé), Sublime Text, ou même le Bloc-notes
- **Git** installé sur votre ordinateur ([guide d'installation](https://git-scm.com/book/fr/v2/D%C3%A9marrage-rapide-Installation-de-Git))
- Un compte **GitHub** avec accès au dépôt `alexchojnacki.github.io`
- (Optionnel) **Python 3** pour tester en local

### Outils recommandés pour les images

- [ImageMagick](https://imagemagick.org/) ou [Squoosh](https://squoosh.app/) (en ligne) pour optimiser les images
- Un logiciel de retouche photo pour recadrer si besoin

---

## Structure du site

```
alexchojnacki.github.io/
├── index.html           ← Page d'accueil (hero + présentation)
├── pieces.html          ← Galerie des pièces
├── apropos.html         ← Page "À propos"
├── faq.html             ← Foire aux questions
├── contact.html         ← Formulaire de contact + carte
├── mentions-legales.html ← Mentions légales
├── cgv.html             ← Conditions générales de vente
├── 404.html             ← Page d'erreur personnalisée
├── css/
│   └── style.css        ← Toutes les mises en forme du site
├── js/
│   └── main.js          ← Menu mobile, lightbox, animations
├── images/              ← Toutes les images du site
│   ├── logo_nobg.png    ← Logo du site
│   ├── alex.jpg/webp    ← Photo portrait
│   ├── shelf.jpg/webp   ← Photo étagère (accueil)
│   ├── 25.jpg/webp      ← Image hero (fond d'accueil)
│   └── 1-26.jpg/webp    ← Photos des pièces
├── en/                  ← Version anglaise du site
├── CNAME                ← Nom de domaine personnalisé
├── robots.txt           ← Configuration pour les moteurs de recherche
└── sitemap.xml          ← Plan du site pour le référencement
```

**Règle importante** : chaque image existe en **deux versions** — `.jpg` et `.webp`. Le format WebP est plus léger et utilisé en priorité par les navigateurs modernes. Le JPG sert de fallback.

---

## Lancer le site en local

Avant de publier vos modifications, testez-les sur votre ordinateur :

```bash
# Ouvrir un terminal dans le dossier du projet, puis :
python3 -m http.server 8000
```

Ouvrez ensuite **http://localhost:8000** dans votre navigateur.

> **Pourquoi ne pas ouvrir le fichier directement ?** Certaines fonctionnalités (comme les chemins d'images) peuvent ne pas fonctionner correctement si vous ouvrez le fichier HTML directement dans le navigateur.

---

## Modifier du texte

Le texte du site se trouve directement dans les fichiers `.html`. Pour modifier un texte :

1. Ouvrez le fichier HTML concerné dans votre éditeur
2. Recherchez le texte à modifier (Ctrl+F / Cmd+F)
3. Modifiez-le directement
4. Sauvegardez le fichier
5. Rafraîchissez votre navigateur pour voir le résultat

### Exemple : changer le slogan de la page d'accueil

Dans `index.html`, cherchez :
```html
<p class="hero-tagline">Ce qui est fait lentement reste.</p>
```
Remplacez le texte entre les balises `<p>` et `</p>`.

### Caractères spéciaux HTML

Si vous utilisez des caractères spéciaux, utilisez les entités HTML :
| Caractère | Code HTML |
|-----------|-----------|
| é | `&eacute;` ou directement `é` |
| è | `&egrave;` ou directement `è` |
| à | `&agrave;` ou directement `à` |
| « | `&laquo;` |
| » | `&raquo;` |

> En pratique, les accents français fonctionnent directement car le site utilise l'encodage UTF-8.

---

## Gérer les images

### Ajouter une nouvelle image

1. **Préparez l'image** :
   - Format : JPG pour les photos
   - Taille maximale recommandée : **500 Ko** pour les pièces, **250 Ko** pour le hero
   - Dimensions : environ **1200px de large** pour les pièces, **1920x1080** pour le hero

2. **Optimisez l'image** (avec ImageMagick) :
   ```bash
   # Redimensionner et compresser
   convert source.jpg -resize 1200x -quality 85 images/27.jpg
   ```

3. **Créez la version WebP** :
   ```bash
   cwebp -q 80 images/27.jpg -o images/27.webp
   ```
   Ou utilisez [Squoosh](https://squoosh.app/) en ligne.

4. Placez les deux fichiers dans le dossier `images/`

### Changer l'image d'accueil (hero)

L'image de fond de la page d'accueil est définie dans `index.html`. Cherchez :
```html
<section class="hero" style="background-image: url('images/25.jpg')">
```
Et dans la balise `<picture>` correspondante pour la source WebP.

Remplacez `25.jpg` par le nom de votre nouvelle image. Dimensions idéales : **1920x1080** ou **1536x1024**.

### Changer la photo portrait

La photo de la page À propos est dans `apropos.html`. Cherchez la balise `<picture>` contenant `alex.jpg` et remplacez le fichier.

---

## Gérer la galerie

La galerie se trouve dans `pieces.html`. Les images sont affichées dans une grille à 2 colonnes, où **chaque 3e image s'étend sur toute la largeur**.

### Ajouter une image à la galerie

Ajoutez ce bloc HTML dans la section `.gallery-grid`, à l'endroit voulu :

```html
<a href="images/27.jpg" class="gallery-item" data-lightbox>
  <picture>
    <source srcset="images/27.webp" type="image/webp">
    <img src="images/27.jpg"
         alt="Description de la pièce en français"
         loading="lazy"
         width="800"
         height="600">
  </picture>
</a>
```

**Points importants :**
- `href` : lien vers l'image en taille réelle (affichée dans la lightbox)
- `data-lightbox` : attribut indispensable pour que la lightbox fonctionne
- `alt` : description de l'image (important pour l'accessibilité et le référencement)
- `loading="lazy"` : l'image ne se charge que quand elle devient visible (performance)
- `width` et `height` : dimensions réelles de l'image (évite les sauts de mise en page)

### Retirer une image de la galerie

Supprimez le bloc `<a class="gallery-item" ...>...</a>` correspondant.

### Ordre des images

Les images s'affichent dans l'ordre du code HTML. Déplacez les blocs `<a>` pour réorganiser.

### Disposition automatique

- Images 1 et 2 : côte à côte (2 colonnes)
- Image 3 : pleine largeur
- Images 4 et 5 : côte à côte
- Image 6 : pleine largeur
- Et ainsi de suite...

Cette disposition est automatique grâce au CSS (`nth-child(3n)`). Vous n'avez rien à configurer.

---

## Modifier la page d'accueil

Le fichier `index.html` contient deux grandes sections :

### 1. Section Hero (plein écran)

```
┌─────────────────────────────────┐
│      (image de fond 25.jpg)     │
│                                 │
│        Alex le Potier           │  ← h1
│  Ce qui est fait lentement...   │  ← .hero-tagline
│  Grès tourné à la main          │  ← .hero-tag
│      [Voir les pièces]          │  ← bouton CTA
│                                 │
└─────────────────────────────────┘
```

### 2. Section Démarche

Contient :
- Un texte de présentation
- 3 arguments (icônes + texte) dans `.arguments-container`
- Une photo d'étagère
- Une section "Commandes sur demande"
- Un bouton "En savoir plus"

Pour modifier les arguments, cherchez les blocs `.argument` :
```html
<div class="argument">
  <span class="argument-icon">🏺</span>
  <div>
    <strong>Titre</strong>
    <p>Description</p>
  </div>
</div>
```

---

## Modifier la page À propos

Le fichier `apropos.html` utilise un style éditorial avec des sections alternées (fond blanc / fond beige).

Chaque section suit ce modèle :
```html
<section class="editorial-section">  <!-- ou editorial-section--alt pour le fond beige -->
  <div class="editorial-content">
    <h2>Titre de section</h2>
    <p>Contenu...</p>
  </div>
</section>
```

Pour mettre en valeur un mot ou une phrase, utilisez :
```html
<span class="highlight">texte important</span>
```

---

## Modifier la FAQ

Le fichier `faq.html` contient 10 questions/réponses. Chaque question suit ce modèle :

```html
<div class="faq-item">
  <h2>La question ?</h2>
  <p>La réponse.</p>
</div>
```

### Ajouter une question

Ajoutez un nouveau bloc `.faq-item` dans le `.faq-container`.

### Mettre à jour le SEO de la FAQ

La FAQ contient aussi des **données structurées** (JSON-LD) pour Google. Quand vous ajoutez ou modifiez une question, mettez aussi à jour le bloc `<script type="application/ld+json">` en bas de la page `<head>` :

```json
{
  "@type": "Question",
  "name": "Votre question ?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "Votre réponse."
  }
}
```

---

## Modifier la page Contact

### Informations de contact

Dans `contact.html`, la colonne gauche (`.contact-info`) contient :
- L'adresse / localisation
- Le lien Instagram
- La carte OpenStreetMap (iframe)
- Le numéro SIRET

### Carte OpenStreetMap

La carte est un iframe intégré. Pour changer la localisation, modifiez les coordonnées dans l'URL de l'iframe :
```html
<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=...&marker=50.5633,2.9875&...">
```

### Formulaire

Le formulaire envoie les données à **Formspree** (voir section [Services externes](#services-externes)). Les champs sont : nom, email, sujet, message.

---

## Modifier les pages légales

- `mentions-legales.html` : mentions légales (obligatoires en France)
- `cgv.html` : conditions générales de vente

Ces pages utilisent la classe `.legal` pour le style. Modifiez le texte directement.

**Informations à mettre à jour si elles changent :**
- Nom / raison sociale
- Adresse
- SIRET
- Email de contact

---

## Modifier le header et le footer

Le header et le footer sont **répétés dans chaque fichier HTML** (il n'y a pas de système de templates). Si vous modifiez l'un, **pensez à reporter la modification dans tous les fichiers** :

Fichiers contenant le header/footer :
- `index.html`
- `pieces.html`
- `apropos.html`
- `faq.html`
- `contact.html`
- `mentions-legales.html`
- `cgv.html`
- `404.html`
- Tous les fichiers dans `en/`

### Header

Le header contient :
- Le logo (image `images/logo_nobg.png`)
- La navigation : Accueil, Pièces, À propos, FAQ, Contact, icône Instagram
- Le bouton menu mobile (hamburger)
- Un sélecteur de langue (FR/EN)

Pour marquer la page active dans la navigation, ajoutez la classe `active` sur le bon lien :
```html
<a href="pieces.html" class="nav-link active">Pièces</a>
```

### Footer

Le footer contient 3 colonnes :
1. Logo + nom + slogan
2. Lien contact
3. Liens légaux + Instagram + copyright

---

## Gérer le formulaire de contact

Le formulaire utilise **Formspree**, un service externe qui reçoit les soumissions et les envoie par email.

### Configuration actuelle

- **Endpoint** : `https://formspree.io/f/mreakdry`
- **Protection anti-spam** : champ honeypot (`_gotcha`)

### Accéder aux messages reçus

1. Connectez-vous sur [formspree.io](https://formspree.io)
2. Accédez au formulaire `mreakdry`
3. Vous y trouverez tous les messages envoyés via le site

### Changer l'email de réception

Modifiez-le dans les paramètres du formulaire sur Formspree (pas dans le code du site).

### Changer de formulaire Formspree

Dans `contact.html`, modifiez l'attribut `action` du formulaire :
```html
<form class="contact-form" action="https://formspree.io/f/VOTRE_ID" method="POST">
```

---

## Publier les modifications

Une fois vos modifications testées en local :

```bash
# 1. Vérifier ce qui a changé
git status

# 2. Ajouter les fichiers modifiés
git add .

# 3. Créer un commit avec un message descriptif
git commit -m "Description de vos modifications"

# 4. Envoyer sur GitHub (déclenche la mise en ligne)
git push
```

Le site sera mis à jour automatiquement en quelques minutes sur **alex.lepotier.ovh**.

### Vérifier le déploiement

Après le push, vous pouvez vérifier le statut du déploiement :
1. Allez sur le dépôt GitHub
2. Cliquez sur l'onglet "Actions"
3. Le dernier workflow "pages build and deployment" doit être vert

---

## Services externes

| Service | Utilisation | Accès |
|---------|-------------|-------|
| **GitHub Pages** | Hébergement du site | [github.com](https://github.com) — dépôt `alexchojnacki.github.io` |
| **Formspree** | Réception des messages du formulaire contact | [formspree.io](https://formspree.io) — formulaire `mreakdry` |
| **OVHcloud** | Registrar du nom de domaine `lepotier.ovh` | [ovhcloud.com](https://www.ovhcloud.com) |
| **Instagram** | Réseau social lié | [@alexlepotier](https://www.instagram.com/alexlepotier) |
| **OpenStreetMap** | Carte intégrée sur la page contact | Pas de compte nécessaire (iframe public) |

### Renouvellements à surveiller

- **Nom de domaine** (`lepotier.ovh`) : à renouveler chez OVHcloud
- **Formspree** : vérifier le plan (gratuit = limité en nombre de soumissions/mois)
