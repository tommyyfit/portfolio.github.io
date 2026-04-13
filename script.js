// ============================================
// Enhanced Portfolio Script - Bug Free Version
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  'use strict';

  // ============================================
  // 1. PAGE LOADER
  // ============================================
  function removeLoader() {
    setTimeout(function () {
      const loader = document.getElementById("loader");
      if (!loader) {
        console.warn('⚠️ Loader element not found');
        return;
      }

      loader.style.opacity = "0";
      loader.style.transition = "opacity 0.7s ease-out";
      setTimeout(() => {
        try {
          if (loader.parentNode) {
            loader.remove();
          }
        } catch (e) {
          console.error('Error removing loader:', e);
        }
        document.body.classList.add('loaded');
      }, 700);
    }, 800);
  }

  // ============================================
  // TRIPLE-A REVEAL & INTERACTIVE ENGINE
  // ============================================

  // 1. Intersection Observer for Scroll Reveals
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // FIX: prevent repeated triggers
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

  // 2. Header Scroll Logic (guarded)
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      try {
        if (window.scrollY > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      } catch (e) {
        console.error('Error in header scroll listener:', e);
      }
    }, { passive: true });
  }

  // 3. Remove Loader after page load (SINGLE place)
  window.addEventListener('load', removeLoader);

// ============================================
// 2. TYPING EFFECT - FIXED VERSION
// ============================================
function initializeTypingEffect() {
  const typedSubtitle = document.getElementById("typed-subtitle");
  if (!typedSubtitle) {
    console.warn('⚠️ Typing subtitle element not found');
    return;
  }

  const subtitle = "Web Development • Modern Design • Clean Code";
  let idx = 0;
  let isTyping = true;
  let typingTimeout;

  // Clear any existing content and classes
  typedSubtitle.textContent = '';
  typedSubtitle.classList.remove("cursor-blink");
  if (typedSubtitle._typingTimeout) {
    clearTimeout(typedSubtitle._typingTimeout);
  }

  function type() {
    if (!isTyping || idx >= subtitle.length) {
      isTyping = false;
      typedSubtitle.classList.add("cursor-blink");
      return;
    }

    typedSubtitle.textContent += subtitle.charAt(idx++);
    typingTimeout = setTimeout(type, 60 + Math.random() * 40);
    typedSubtitle._typingTimeout = typingTimeout;
  }

  setTimeout(() => {
    if (isTyping) type();
  }, 1200);

  setTimeout(() => {
    if (isTyping) {
      isTyping = false;
      if (typingTimeout) clearTimeout(typingTimeout);
      typedSubtitle.textContent = subtitle;
      typedSubtitle.classList.add("cursor-blink");
    }
  }, 10000);
}

 // ============================================
// 3. SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.section-reveal, .animate-on-scroll').forEach(el => {
      el.classList.add('section-visible', 'visible');
    });
    return;
  }

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('section-visible');
        sectionObserver.unobserve(entry.target); // FIX
      }
    });
  }, observerOptions);

  const elementObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('visible');

      if (entry.target.classList.contains('stagger-container')) {
        const children = Array.from(entry.target.children);
        children.forEach((child, index) => {
          setTimeout(() => {
            child.classList.add('visible');
          }, index * 100);
        });
      }

      elementObserver.unobserve(entry.target); // FIX
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -20px 0px'
  });

  document.querySelectorAll('.section-reveal').forEach(section => {
    sectionObserver.observe(section);
  });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    elementObserver.observe(el);
  });

  document.querySelectorAll('.stagger-container').forEach(container => {
    elementObserver.observe(container);
  });
}

 // ============================================
// 4. MAGNETIC BUTTONS EFFECT
// ============================================
function initMagneticButtons() {
  const magneticBtns = document.querySelectorAll('.magnetic-btn');

  magneticBtns.forEach(btn => {
    let ticking = false;

    btn.addEventListener('mousemove', (e) => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const angleX = (y - centerY) / 10;
        const angleY = (centerX - x) / 10;

        btn.style.setProperty('--tx', `${angleY}px`);
        btn.style.setProperty('--ty', `${angleX}px`);
        btn.style.transform =
          `scale(1.05) translateX(${angleY}px) translateY(${angleX}px)`;

        ticking = false;
      });
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1) translateX(0) translateY(0)';
    });
  });
}

 // ============================================
// 5. PARTICLE SYSTEM (FIXED & STABLE)
// ============================================
let particlesCreated = false;

function createParticles() {
  if (particlesCreated) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const container = document.getElementById('particles-container');
  if (!container) {
    console.warn('⚠️ Particles container not found');
    return;
  }

  particlesCreated = true;

  try {
    // Ensure container can hold absolutely positioned particles
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    const particleCount = window.innerWidth < 768 ? 10 : 20;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('span');
      particle.className = 'particle';

      const size = Math.random() * 4 + 2;
      const duration = Math.random() * 12 + 8;
      const delay = Math.random() * 6;

      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${duration}s`;
      particle.style.animationDelay = `${delay}s`;
      particle.style.opacity = `${Math.random() * 0.5 + 0.2}`;

      container.appendChild(particle);
    }
  } catch (e) {
    console.error('Error creating particles:', e);
    particlesCreated = false;
  }
}

// ============================================
// 6. IMAGE LAZY LOADING
// ============================================
function initImageLoading() {
  const images = document.querySelectorAll('img[loading="lazy"]');

  images.forEach(img => {
    if (img.dataset.imgInit) return; // FIX: prevent double init
    img.dataset.imgInit = 'true';

    img.classList.add('blur-load');

    if (img.complete) {
      img.classList.add('loaded');
      img.classList.remove('blur-load');
    } else {
      img.addEventListener('load', () => {
        img.classList.add('loaded');
        img.classList.remove('blur-load');
      }, { once: true });

      img.addEventListener('error', () => {
        console.warn('Image failed to load:', img.src);
        img.classList.remove('blur-load');
      }, { once: true });
    }
  });
}

 // ============================================
// 7. SCROLL PROGRESS BAR
// ============================================
function initProgressBar() {
  const progressBar = document.getElementById("progress");
  if (!progressBar) {
    console.warn('⚠️ Progress bar element not found');
    return;
  }

  let ticking = false;

  function updateProgress() {
    try {
      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const trackLength = Math.max(docHeight - winHeight, 1);

      const progress = Math.min((scrollTop / trackLength) * 100, 100);
      progressBar.style.width = progress + "%";
    } catch (e) {
      console.error('Error updating progress bar:', e);
    }

    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });

  // FIX: set initial state
  updateProgress();
}

// ============================================
// 8. MOBILE MENU - IMPROVED
// ============================================
function initMobileMenu() {
  const mobileBtn = document.getElementById("mobile-btn");
  const closeMenu = document.getElementById("close-menu");
  const mobileMenu = document.getElementById("mobile-menu");

  if (!mobileBtn || !mobileMenu) return;
  if (mobileMenu.dataset.menuInit) return; // FIX
  mobileMenu.dataset.menuInit = 'true';

  function openMenu() {
    if (mobileMenu.classList.contains('open')) return; // FIX
    mobileMenu.classList.add("open");
    document.body.style.overflow = "hidden";
    mobileBtn.setAttribute("aria-expanded", "true");
    mobileMenu.setAttribute("aria-hidden", "false");
    closeMenu?.focus();
  }

  function closeMenuFunc() {
    if (!mobileMenu.classList.contains('open')) return; // FIX
    mobileMenu.classList.remove("open");
    document.body.style.overflow = "";
    mobileBtn.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    mobileBtn.focus();
  }

  mobileBtn.addEventListener("click", openMenu);
  closeMenu?.addEventListener("click", closeMenuFunc);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenuFunc();
    }
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenuFunc);
  });

  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) {
      closeMenuFunc();
    }
  });
}

// ============================================
// 9. FLOATING ACTION BUTTON
// ============================================
function initFAB() {
  const fab = document.getElementById("fab");
  if (!fab) return;

  fab.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  let ticking = false;

  function updateFAB() {
    if (window.pageYOffset > 300) {
      fab.style.opacity = "1";
      fab.style.visibility = "visible";
    } else {
      fab.style.opacity = "0";
      fab.style.visibility = "hidden";
    }
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(updateFAB);
      ticking = true;
    }
  }, { passive: true });

  // FIX: set initial state
  updateFAB();
}

  // ============================================
// 10. SMOOTH SCROLLING
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    if (anchor.dataset.scrollInit) return;
    anchor.dataset.scrollInit = 'true';

    anchor.addEventListener('click', function (e) {
      try {
        const href = this.getAttribute('href');

        if (!href || href === '#' || href.length < 2) return;

        let target;
        try {
          target = document.querySelector(href);
        } catch {
          return;
        }

        if (!target) return;

        e.preventDefault();

        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition =
          target.getBoundingClientRect().top +
          window.pageYOffset -
          headerHeight -
          20;

        window.scrollTo({
          top: Math.max(0, targetPosition),
          behavior: 'smooth'
        });
      } catch (e) {
        console.error('Error in smooth scroll:', e);
      }
    });
  });
}

 // ============================================
// 11. RIPPLE EFFECT
// ============================================
function initRippleEffect() {
  if (document.body.dataset.rippleInit) return; // FIX
  document.body.dataset.rippleInit = 'true';

  document.addEventListener('click', function (e) {
    const target = e.target.closest('.btn-ripple');
    if (!target) return;

    const ripple = document.createElement('span');
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple 0.6s linear;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
    `;

    target.style.position = 'relative';
    target.style.overflow = 'hidden';
    target.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
}

 // ============================================
// 12. ENHANCED CARD INTERACTIONS
// ============================================
function initCardInteractions() {
  if (window.innerWidth < 768) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = document.querySelectorAll('.project-card, .card-hover');

  cards.forEach(card => {
    let ticking = false;

    card.addEventListener('mousemove', (e) => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateY = (x - centerX) / 25;
        const rotateX = (centerY - y) / 25;

        card.style.transform =
          `perspective(1000px)
           rotateX(${rotateX}deg)
           rotateY(${rotateY}deg)
           scale3d(1.02, 1.02, 1.02)`;

        ticking = false;
      });
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform =
        'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  });
}

 // ============================================
// 12.5. PROJECTS LOADER - REWRITTEN & FIXED
// ============================================
function initWebCollection() {
  const grid = document.getElementById('web-collection-grid');
  
  if (!grid) {
    console.error('❌ Grid not found');
    return;
  }

  // YOUR PROJECTS
  const websites = [
    {
      title: "FadeZone Barbers",
      description: "Ostrava's king of street style. Fresh fades, sharp beard trims. No appointments. Walk-ins only.",
      link: "webs/Barber/index.html",
      image: null,
      color: '#E11D48'  // Red for barber
    },
    {
      title: "Beauty Spa",
      description: "Luxury wellness and beauty treatments. Relax, rejuvenate, and feel your best.",
      link: "webs/Beauty spa/index.html",
      image: null,
      color: '#EC4899'  // Pink for spa
    },
    {
      title: "Precision Recomp",
      description: "Professional body recomposition and fitness training programs.",
      link: "webs/Precision Recomp/index.html",
      image: null,
      color: '#06B6D4'  // Cyan for fitness
    }
  ];

  if (!websites || websites.length === 0) {
    grid.innerHTML = '<p>No projects found</p>';
    return;
  }

  // Clear loading message
  grid.innerHTML = '';

  // Build HTML
  websites.forEach((site) => {
    try {
      const card = document.createElement('article');
      card.className = 'group bg-white rounded-2xl overflow-hidden border border-slate-200/70 hover:shadow-xl transition-all duration-500';
      
      const link = document.createElement('a');
      link.href = site.link;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'flex flex-col h-full';

      // Image section
      const imgSection = document.createElement('div');
      imgSection.className = 'relative h-52 overflow-hidden bg-slate-100';
      imgSection.style.backgroundColor = site.color;
      
      const placeholder = document.createElement('div');
      placeholder.className = 'w-full h-full flex items-center justify-center';
      placeholder.innerHTML = `
        <div class="text-center text-white">
          <div style="font-size: 3rem; margin-bottom: 8px;">🔗</div>
          <p style="font-size: 12px; font-weight: 500;">Click to view</p>
        </div>
      `;
      imgSection.appendChild(placeholder);
      
      link.appendChild(imgSection);

      // Content section
      const content = document.createElement('div');
      content.className = 'flex flex-col flex-1 p-6';
      
      const title = document.createElement('h3');
      title.style.cssText = 'font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 8px;';
      title.textContent = site.title;
      content.appendChild(title);
      
      const desc = document.createElement('p');
      desc.style.cssText = 'font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 16px;';
      desc.textContent = site.description;
      content.appendChild(desc);
      
      const cta = document.createElement('div');
      cta.style.cssText = `margin-top: auto; display: flex; align-items: center; gap: 8px; color: ${site.color}; font-weight: 500; font-size: 14px;`;
      cta.textContent = 'View website →';
      content.appendChild(cta);
      
      link.appendChild(content);
      card.appendChild(link);
      grid.appendChild(card);
    } catch (e) {
      console.error('Error creating project card for', site.title, ':', e);
    }
  });

  console.log('✅ Projects loaded:', websites.length);
}

 // ============================================
// 13. INITIALIZATION
// ============================================
function init() {
  if (document.body.dataset.appInit) return;
  document.body.dataset.appInit = 'true';

  try {
    // Initialize projects first
    initWebCollection();
    
    // Core functionality
    removeLoader();
    initializeTypingEffect();
    initScrollAnimations();
    initProgressBar();
    initMobileMenu();
    initFAB();
    initSmoothScroll();

    // Image loading
    initImageLoading();

    // Add stagger container class to specific grids (BEFORE enhanced effects)
    const webGridContainer = document.getElementById('web-collection-grid');
    const resourcesGrid = document.querySelector('#resources .grid');
    const aboutGrid = document.querySelector('#about .grid');

    if (webGridContainer) webGridContainer.classList.add('stagger-container');
    if (resourcesGrid) resourcesGrid.classList.add('stagger-container');
    if (aboutGrid) aboutGrid.classList.add('stagger-container');

    // Enhanced interactions (skip on mobile or reduced motion)
    if (
      window.innerWidth >= 768 &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      initMagneticButtons();
      createParticles();
      initRippleEffect();
      initCardInteractions();
    }

    console.log('✅ tommyy.fit portfolio initialized successfully!');
  } catch (e) {
    console.error('❌ Error initializing portfolio:', e);
  }
}

// Start initialization - INSIDE DOMContentLoaded
init();

 // ============================================
// 14. PERFORMANCE MONITORING (SAFE)
// ============================================
try {
  if ('PerformanceObserver' in window && !window.__perfObserverInit) {
    window.__perfObserverInit = true;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', Math.round(entry.startTime), 'ms');
        }
      }
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }
} catch (e) {
  console.warn('Performance monitoring unavailable:', e.message);
}

// ============================================
// 15. PAGE VISIBILITY OPTIMIZATION
// ============================================
document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    console.log('Page hidden - pausing animations');
  } else {
    console.log('Page visible - resuming animations');
  }
});

// ============================================
// 16. RESIZE HANDLER
// ============================================
let resizeTimeout;
window.addEventListener('resize', function () {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    console.log('Window resized');
    // Future: re-init card interactions if needed
  }, 250);
}, { passive: true });
}); // Close DOMContentLoaded event listener