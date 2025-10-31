document.addEventListener("DOMContentLoaded", function () {
  // Remove loader when page is loaded
  setTimeout(function () {
    const loader = document.getElementById("loader");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 700);
    }
  }, 1000);

  // Initialize typing effect
  // Initialize typing effect - ROBUST VERSION
  function initializeTypingEffect() {
    const typedSubtitle = document.getElementById("typed-subtitle");
    if (!typedSubtitle) return;

    const subtitle = "Fitness • Nutrition • Travel • Web Development";
    let idx = 0;
    let isTyping = true;

    // Clear any existing content and classes
    typedSubtitle.textContent = '';
    typedSubtitle.classList.remove("cursor-blink");

    function type() {
      // Double safety check
      if (idx < subtitle.length && isTyping) {
        typedSubtitle.textContent += subtitle.charAt(idx);
        idx++;
        setTimeout(type, 60 + Math.random() * 30);
      } else {
        // Clean up when done
        isTyping = false;
        typedSubtitle.classList.add("cursor-blink");
      }
    }

    // Start typing after a short delay
    setTimeout(type, 1000);

    // Optional: Add a timeout as ultimate safety (stops after 10 seconds max)
    setTimeout(() => {
      isTyping = false;
      if (typedSubtitle.textContent !== subtitle) {
        typedSubtitle.textContent = subtitle;
        typedSubtitle.classList.add("cursor-blink");
      }
    }, 10000);
  }

  // Initialize scroll-triggered animations
  function initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
        }
      });
    }, observerOptions);

    const elementObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Add stagger animation to children if it's a stagger container
          if (entry.target.classList.contains('stagger-container')) {
            const children = entry.target.children;
            Array.from(children).forEach((child, index) => {
              setTimeout(() => {
                child.classList.add('visible');
              }, index * 100);
            });
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -20px 0px'
    });

    // Observe sections
    document.querySelectorAll('.section-reveal').forEach(section => {
      sectionObserver.observe(section);
    });

    // Observe individual elements
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      elementObserver.observe(el);
    });

    // Observe staggered containers
    document.querySelectorAll('.stagger-container').forEach(container => {
      elementObserver.observe(container);
    });
  }

  // Magnetic buttons effect
  function initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.magnetic-btn');

    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const angleX = (y - centerY) / 10;
        const angleY = (centerX - x) / 10;

        btn.style.setProperty('--tx', `${angleY}px`);
        btn.style.setProperty('--ty', `${angleX}px`);
        btn.style.transform = `scale(1.05) translateX(${angleY}px) translateY(${angleX}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1) translateX(0) translateY(0)';
      });
    });
  }

  // Particle system for hero section
  function createParticles() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const container = document.getElementById('particles-container');
    if (!container) return;

    const particleCount = 15;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';

      const size = Math.random() * 4 + 2;
      const duration = Math.random() * 10 + 8;
      const delay = Math.random() * 5;

      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: rgba(56, 189, 248, ${Math.random() * 0.4 + 0.2});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
      `;

      container.appendChild(particle);
    }
  }

  // Image loading with blur effect
  function initImageLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');

    images.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });

        // Fallback for images that might fail to load
        img.addEventListener('error', () => {
          console.warn('Image failed to load:', img.src);
        });
      }
    });
  }

  // Scroll progress bar
  function initProgressBar() {
    window.addEventListener("scroll", function () {
      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const trackLength = docHeight - winHeight;
      const progress = Math.min((scrollTop / trackLength) * 100, 100);

      const progressBar = document.getElementById("progress");
      if (progressBar) {
        progressBar.style.width = progress + "%";
      }
    });
  }

  // Mobile menu toggle
  function initMobileMenu() {
    const mobileBtn = document.getElementById("mobile-btn");
    const closeMenu = document.getElementById("close-menu");
    const mobileMenu = document.getElementById("mobile-menu");

    if (mobileBtn && mobileMenu) {
      mobileBtn.addEventListener("click", function () {
        mobileMenu.classList.add("open");
        document.body.style.overflow = "hidden";
        mobileBtn.setAttribute("aria-expanded", "true");
        mobileMenu.setAttribute("aria-hidden", "false");
      });
    }

    if (closeMenu && mobileMenu) {
      closeMenu.addEventListener("click", function () {
        mobileMenu.classList.remove("open");
        document.body.style.overflow = "auto";
        mobileBtn.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-hidden", "true");
      });
    }

    // Close mobile menu when clicking on links
    const mobileLinks = mobileMenu?.querySelectorAll('a');
    mobileLinks?.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove("open");
        document.body.style.overflow = "auto";
        mobileBtn.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-hidden", "true");
      });
    });
  }

  // Floating Action Button
  function initFAB() {
    const fab = document.getElementById("fab");
    if (!fab) return;

    fab.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Show/hide FAB based on scroll position
    window.addEventListener("scroll", function () {
      if (window.pageYOffset > 300) {
        fab.style.opacity = "1";
        fab.style.visibility = "visible";
      } else {
        fab.style.opacity = "0";
        fab.style.visibility = "hidden";
      }
    });
  }

  // Form validation and submission
  function initContactForm() {
    const contactForm = document.getElementById("contactForm");
    if (!contactForm) return;

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = document.getElementById("name");
      const email = document.getElementById("email");
      const message = document.getElementById("message");
      const formMessage = document.getElementById("form-message");
      const submitBtn = document.getElementById("submit-btn");

      let isValid = true;

      // Reset errors
      document.querySelectorAll(".error-message").forEach((el) => el.classList.add("hidden"));
      document.querySelectorAll("input, textarea").forEach((el) => el.classList.remove("border-red-500"));

      // Validate name
      if (!name.value.trim()) {
        document.getElementById("name-error").classList.remove("hidden");
        name.classList.add("border-red-500");
        isValid = false;
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim() || !emailRegex.test(email.value)) {
        document.getElementById("email-error").classList.remove("hidden");
        email.classList.add("border-red-500");
        isValid = false;
      }

      // Validate message
      if (!message.value.trim()) {
        document.getElementById("message-error").classList.remove("hidden");
        message.classList.add("border-red-500");
        isValid = false;
      }

      if (!isValid) {
        formMessage.textContent = "Please fix the errors above.";
        formMessage.className = "bg-red-100 text-red-700 p-4 rounded-lg mb-4 text-center";
        formMessage.classList.remove("hidden");
        formMessage.style.animation = "shake 0.5s ease-in-out";
        return;
      }

      // If valid, submit form
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
      contactForm.classList.add("form-loading");

      // Using Formspree AJAX submission
      const formData = new FormData(contactForm);
      fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            formMessage.textContent = "Message sent successfully! I'll get back to you soon!";
            formMessage.className = "bg-green-100 text-green-700 p-4 rounded-lg mb-4 text-center";
            formMessage.classList.remove("hidden");
            formMessage.style.animation = "fadeInUp 0.5s ease-out";
            contactForm.reset();
          } else {
            throw new Error("Form submission failed");
          }
        })
        .catch((error) => {
          formMessage.textContent =
            "Sorry, there was an error sending your message. Please try again later or email me directly.";
          formMessage.className = "bg-red-100 text-red-700 p-4 rounded-lg mb-4 text-center";
          formMessage.classList.remove("hidden");
          formMessage.style.animation = "shake 0.5s ease-in-out";
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send Message";
          contactForm.classList.remove("form-loading");
        });
    });

    // Add focus animations to form inputs
    const formInputs = contactForm.querySelectorAll('input, textarea');
    formInputs.forEach(input => {
      input.classList.add('form-input');

      input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
      });

      input.addEventListener('blur', () => {
        if (!input.value) {
          input.parentElement.classList.remove('focused');
        }
      });
    });
  }

  // Smooth scrolling for anchor links
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Skip if it's just "#"
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();

          // Calculate offset for fixed header
          const headerHeight = document.querySelector('header')?.offsetHeight || 0;
          const targetPosition = target.offsetTop - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // Add ripple effect to buttons
  function initRippleEffect() {
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

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }

  // Enhanced card interactions
  function initCardInteractions() {
    const cards = document.querySelectorAll('.project-card, .card-hover');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        if (window.innerWidth < 768) return; // Only on desktop

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateY = (x - centerX) / 25;
        const rotateX = (centerY - y) / 25;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      });
    });
  }

  // Initialize everything
  function init() {
    initializeTypingEffect();
    initScrollAnimations();
    initMagneticButtons();
    createParticles();
    initImageLoading();
    initProgressBar();
    initMobileMenu();
    initFAB();
    initContactForm();
    initSmoothScroll();
    initRippleEffect();
    initCardInteractions();

    // Add stagger container class to resources and projects grids
    const resourcesGrid = document.querySelector('#resources .grid');
    const projectsGrid = document.querySelector('#projects .grid');
    const aboutGrid = document.querySelector('#about .grid');

    if (resourcesGrid) resourcesGrid.classList.add('stagger-container');
    if (projectsGrid) projectsGrid.classList.add('stagger-container');
    if (aboutGrid) aboutGrid.classList.add('stagger-container');

    console.log('🚀 tommyy.fit portfolio initialized with enhanced animations!');
  }

  // Start the initialization
  init();
});

// Add performance optimization for animations
window.addEventListener('load', function () {
  // RequestAnimationFrame for smooth animations
  function updateAnimations() {
    // Any continuous animations would go here
    requestAnimationFrame(updateAnimations);
  }
  updateAnimations();
});

// Handle page visibility changes for performance
document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    // Page is hidden, could pause non-essential animations
  } else {
    // Page is visible again
  }
});