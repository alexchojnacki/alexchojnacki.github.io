/**
 * Alex le Potier - JavaScript
 * Menu mobile + Lightbox galerie
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initLightbox();
  initScrollAnimations();
});

/**
 * Menu mobile toggle
 */
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  if (!menuToggle || !nav) return;

  function closeMenu() {
    menuToggle.classList.remove('active');
    nav.classList.remove('active');
  }

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    nav.classList.toggle('active');
  });

  // Fermer le menu au clic sur un lien
  const navLinks = nav.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Fermer le menu avec Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('active')) {
      closeMenu();
      menuToggle.focus();
    }
  });
}

/**
 * Lightbox pour la galerie
 */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const galleryItems = document.querySelectorAll('[data-lightbox]');

  if (!lightbox || !lightboxImage || galleryItems.length === 0) return;

  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');

  // Éléments focusables dans la lightbox (pour le focus trap)
  const focusableElements = [closeBtn, prevBtn, nextBtn];

  // Créer le compteur d'images
  const counter = document.createElement('div');
  counter.className = 'lightbox-counter';
  lightbox.appendChild(counter);

  let currentIndex = 0;
  let triggerElement = null;
  const images = Array.from(galleryItems).map(item => item.href);

  // Ouvrir la lightbox
  galleryItems.forEach((item, index) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      triggerElement = item;
      currentIndex = index;
      showImage(currentIndex);
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
      // Déplacer le focus vers le bouton fermer
      closeBtn.focus();
    });
  });

  // Fermer la lightbox
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    // Retourner le focus à l'élément déclencheur
    if (triggerElement) {
      triggerElement.focus();
      triggerElement = null;
    }
  }

  closeBtn.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Focus trap dans la lightbox
  lightbox.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });

  // Navigation
  function showImage(index) {
    lightboxImage.src = images[index];
    lightboxImage.alt = `Création céramique ${index + 1}`;
    counter.textContent = `${index + 1} / ${images.length}`;
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showImage(currentIndex);
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % images.length;
    showImage(currentIndex);
  }

  prevBtn.addEventListener('click', showPrev);
  nextBtn.addEventListener('click', showNext);

  // Navigation au clavier
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        showPrev();
        break;
      case 'ArrowRight':
        showNext();
        break;
    }
  });

  // Support tactile (swipe)
  let touchStartX = 0;
  let touchEndX = 0;
  const minSwipeDistance = 50;

  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) < minSwipeDistance) return;

    if (swipeDistance > 0) {
      // Swipe vers la droite -> image précédente
      showPrev();
    } else {
      // Swipe vers la gauche -> image suivante
      showNext();
    }
  }
}

/**
 * Animations d'entrée au scroll (Intersection Observer)
 */
function initScrollAnimations() {
  // Respect des préférences utilisateur
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Sélecteurs des éléments à animer
  const selectors = [
    '.hero-content',
    '.demarche h2',
    '.demarche > .container > p',
    '.arguments',
    '.photo-piece',
    '.commandes',
    '.cta-final-minimal',
    '.pieces-header',
    '.gallery-item',
    '.pieces-note',
    '.quote-hero blockquote',
    '.editorial-content',
    '.editorial-image',
    '.faq-header',
    '.faq-item',
    '.faq-cta',
    '.contact-info',
    '.contact-form',
    '.page-header'
  ];

  const elements = document.querySelectorAll(selectors.join(', '));
  if (elements.length === 0) return;

  // Ajouter la classe fade-in sur chaque élément
  elements.forEach(el => {
    el.classList.add('fade-in');
  });

  // Observer les éléments
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}
