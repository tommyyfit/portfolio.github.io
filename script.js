document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const smoothScrollBehavior = () => (prefersReducedMotion.matches ? "auto" : "smooth");

  const websites = [
    {
      title: "FadeZone Barbers",
      description: "A barbershop landing page with pricing, services, and booking front and center.",
      link: "webs/Barber/index.html",
      color: "#e11d48",
      image: "src/fadezoneportfo.png",
    },
    {
      title: "Anet Spa",
      description: "A spa landing page that keeps treatments, ambience, and booking calm and clear.",
      link: "webs/Beauty spa/index.html",
      color: "#ec4899",
      image: "src/anetspaportfo.png",
    },
    {
      title: "Kavarna No. 1",
      description: "A cafe landing page that highlights drinks, atmosphere, and visit details.",
      link: "webs/Coffe Shop/index.html",
      color: "#a16207",
      image: "src/kavarna01portfo.png",
    },
    {
      title: "Eva Hairstyling",
      description: "A salon landing page built to guide visitors from services to appointments.",
      link: "webs/Hair salon/index.html",
      color: "#8b5cf6",
      image: "src/evahairstyleportfo.png",
    },
    {
      title: "Precision Recomp",
      description: "A fitness landing page that simplifies coaching, progress, and next steps.",
      link: "webs/Precision Recomp/index.html",
      color: "#06b6d4",
      image: "src/precisionrecompportfo.png",
    },
    {
      title: "Amazing Clinic",
      description: "A skincare clinic landing page with stronger trust signals and simple booking.",
      link: "webs/Skincare clinic/index.html",
      color: "#14b8a6",
      image: "src/amazingclinicportfo.png",
    },
    {
      title: "Mambo Tattoo",
      description: "A tattoo studio landing page that puts the work first and booking next.",
      link: "webs/Tatto salloon/index.html",
      color: "#f97316",
      image: "src/mambatattoportfo.png",
    },
  ];

  let loaderRemoved = false;
  let particlesCreated = false;

  /* ---- Loader ---- */
  function removeLoader() {
    if (loaderRemoved) return;
    loaderRemoved = true;
    document.body.classList.add("loaded");
    const loader = document.getElementById("loader");
    if (!loader) return;
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.6s ease-out";
    window.setTimeout(() => loader.remove(), 650);
  }

  function scheduleLoaderRemoval() {
    if (!document.getElementById("loader")) { document.body.classList.add("loaded"); return; }
    window.addEventListener("load", () => window.setTimeout(removeLoader, 200), { once: true });
    window.setTimeout(removeLoader, 3000); // failsafe
  }

  /* ---- Header scroll ---- */
  function initHeaderScroll() {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () => header.classList.toggle("scrolled", window.scrollY > 32);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---- Active nav ---- */
  function initSectionNavigation() {
    const navLinks = Array.from(document.querySelectorAll("a[href^='#']").values())
      .filter(a => ["#about","#work","#pricing","#faq","#contact","#projects","#timeline"].includes(a.getAttribute("href")));
    const sectionIds = [...new Set(navLinks.map(a => a.getAttribute("href").slice(1)))];
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
    if (!navLinks.length || !sections.length) return;

    const header = document.querySelector("header");
    let current = null;
    let rafPending = false;

    const update = () => {
      rafPending = false;
      const offset = (header?.offsetHeight ?? 0) + 120;
      const marker = window.scrollY + offset;
      let activeId = null;
      for (const s of sections) { if (s.offsetTop <= marker) activeId = s.id; }
      if (activeId === current) return;
      current = activeId;
      navLinks.forEach(l => {
        const active = l.getAttribute("href") === `#${activeId}`;
        l.classList.toggle("is-active", active);
        active ? l.setAttribute("aria-current","page") : l.removeAttribute("aria-current");
      });
    };

    const schedule = () => { if (!rafPending) { rafPending = true; requestAnimationFrame(update); } };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }

  /* ---- Scroll animations ---- */
  function initScrollAnimations() {
    if (prefersReducedMotion.matches || typeof IntersectionObserver !== "function") {
      document.querySelectorAll(".section-reveal").forEach(el => el.classList.add("section-visible"));
      document.querySelectorAll(".animate-on-scroll").forEach(el => el.classList.add("visible"));
      document.querySelectorAll(".stagger-container > *").forEach(el => el.classList.add("visible"));
      return;
    }

    const sectionObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("section-visible"); sectionObs.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

    const elemObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add("visible");
        elemObs.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -20px 0px" });

    const staggerObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        Array.from(e.target.children).forEach((child, i) => {
          window.setTimeout(() => child.classList.add("visible"), i * 100);
        });
        staggerObs.unobserve(e.target);
      });
    }, { threshold: 0.08 });

    document.querySelectorAll(".section-reveal").forEach(el => sectionObs.observe(el));
    document.querySelectorAll(".animate-on-scroll").forEach(el => elemObs.observe(el));
    document.querySelectorAll(".stagger-container").forEach(el => staggerObs.observe(el));
  }

  /* ---- Particles ---- */
  function createParticles() {
    if (particlesCreated || prefersReducedMotion.matches) return;
    const container = document.getElementById("particles-container");
    if (!container) return;
    particlesCreated = true;
    const fragment = document.createDocumentFragment();
    const count = window.innerWidth < 768 ? 5 : 10;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      const size = (Math.random() * 3 + 1.5).toFixed(1);
      p.className = "particle";
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.animationDuration = `${14 + Math.random() * 10}s`;
      p.style.animationDelay = `${Math.random() * 6}s`;
      p.style.opacity = `${0.1 + Math.random() * 0.2}`;
      fragment.appendChild(p);
    }
    container.appendChild(fragment);
  }

  /* ---- Progress bar ---- */
  function initProgressBar() {
    const bar = document.getElementById("progress");
    if (!bar) return;
    let raf = false;
    const update = () => {
      const scrolled = window.pageYOffset || 0;
      const total = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      bar.style.width = `${Math.min((scrolled / total) * 100, 100)}%`;
      raf = false;
    };
    update();
    window.addEventListener("scroll", () => { if (!raf) { raf = true; requestAnimationFrame(update); } }, { passive: true });
  }

  /* ---- Mobile menu ---- */
  function initMobileMenu() {
    const btn = document.getElementById("mobile-btn");
    const menu = document.getElementById("mobile-menu");
    const backdrop = document.getElementById("mobile-menu-backdrop");
    const closeBtn = document.getElementById("close-menu");
    if (!btn || !menu || menu.dataset.menuInit === "true") return;
    menu.dataset.menuInit = "true";

    const focusSel = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let hideTimeout = null;
    let lastFocus = null;

    const getFocusable = () => Array.from(menu.querySelectorAll(focusSel));
    const isOpen = () => menu.classList.contains("open");

    const close = (restoreFocus = true) => {
      if (!isOpen()) return;
      if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
      menu.classList.remove("open");
      backdrop?.classList.remove("open");
      menu.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-expanded", "false");
      btn.classList.remove("is-open");
      document.body.style.overflow = "";
      hideTimeout = setTimeout(() => { backdrop?.classList.add("hidden"); hideTimeout = null; }, 300);
      if (restoreFocus) (lastFocus instanceof HTMLElement ? lastFocus : btn).focus();
    };

    const open = () => {
      if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
      lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : btn;
      backdrop?.classList.remove("hidden");
      setTimeout(() => { menu.classList.add("open"); backdrop?.classList.add("open"); }, 10);
      menu.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");
      btn.classList.add("is-open");
      document.body.style.overflow = "hidden";
      setTimeout(() => { const [first] = getFocusable(); (first ?? closeBtn ?? menu).focus(); }, 50);
    };

    btn.addEventListener("click", () => isOpen() ? close() : open());
    closeBtn?.addEventListener("click", () => close());
    backdrop?.addEventListener("click", () => close());
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => close()));
    window.addEventListener("resize", () => { if (window.innerWidth >= 768) close(false); });

    document.addEventListener("keydown", e => {
      if (!isOpen()) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      const els = getFocusable();
      if (!els.length) { e.preventDefault(); return; }
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---- FAB ---- */
  function initFAB() {
    const fab = document.getElementById("fab");
    if (!fab) return;
    let raf = false;
    const update = () => {
      const v = window.pageYOffset > 400;
      fab.style.opacity = v ? "1" : "0";
      fab.style.visibility = v ? "visible" : "hidden";
      raf = false;
    };
    fab.addEventListener("click", () => window.scrollTo({ top: 0, behavior: smoothScrollBehavior() }));
    update();
    window.addEventListener("scroll", () => { if (!raf) { raf = true; requestAnimationFrame(update); } }, { passive: true });
  }

  /* ---- Smooth scroll ---- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      if (a.dataset.scrollInit === "true") return;
      a.dataset.scrollInit = "true";
      a.addEventListener("click", e => {
        const href = a.getAttribute("href");
        if (!href || href === "#") return;
        let target = null;
        try { target = document.querySelector(href); } catch { return; }
        if (!target) return;
        e.preventDefault();
        const headerH = document.querySelector("header")?.offsetHeight ?? 0;
        const top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 16;
        window.scrollTo({ top: Math.max(0, top), behavior: smoothScrollBehavior() });
      });
    });
  }

  /* ---- Magnetic buttons ---- */
  function initMagneticButtons() {
    if (prefersReducedMotion.matches) return;
    document.querySelectorAll(".magnetic-btn").forEach(btn => {
      let raf = false;
      btn.addEventListener("mousemove", e => {
        if (raf) return; raf = true;
        requestAnimationFrame(() => {
          const r = btn.getBoundingClientRect();
          const dx = (e.clientX - r.left - r.width / 2) / 12;
          const dy = (e.clientY - r.top - r.height / 2) / 12;
          btn.style.transform = `scale(1.04) translate(${dx}px, ${dy}px)`;
          raf = false;
        });
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---- Image loading ---- */
  function initImageLoading() {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      if (img.dataset.imgInit === "true") return;
      img.dataset.imgInit = "true";
      img.classList.add("blur-load");
      if (img.complete) { img.classList.add("loaded"); img.classList.remove("blur-load"); return; }
      img.addEventListener("load",  () => { img.classList.add("loaded"); img.classList.remove("blur-load"); }, { once: true });
      img.addEventListener("error", () => img.classList.remove("blur-load"), { once: true });
    });
  }

  /* ---- FAQ accordion ---- */
  function initFAQ() {
    const list = document.getElementById("faq-list");
    if (!list) return;
    list.querySelectorAll(".faq-trigger").forEach(trigger => {
      trigger.addEventListener("click", () => {
        const body = trigger.nextElementSibling;
        if (!body) return;
        const isOpen = trigger.getAttribute("aria-expanded") === "true";

        // Close all others
        list.querySelectorAll(".faq-trigger").forEach(t => {
          if (t !== trigger) {
            t.setAttribute("aria-expanded", "false");
            const b = t.nextElementSibling;
            if (b) b.classList.remove("open");
          }
        });

        trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
        body.classList.toggle("open", !isOpen);
      });
    });
  }

  /* ---- Project grid ---- */
  function initWebCollection() {
    const grid = document.getElementById("web-collection-grid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!websites.length) {
      grid.innerHTML = '<p class="col-span-full py-8 text-center text-slate-500">No projects yet.</p>';
      return;
    }

    const frag = document.createDocumentFragment();
    websites.forEach(site => {
      const card = document.createElement("article");
      card.className = "project-card";

      const link = document.createElement("a");
      link.href = site.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "flex h-full flex-col";
      link.setAttribute("aria-label", `View ${site.title} project`);

      const media = document.createElement("div");
      media.className = "project-media";

      if (site.image) {
        const img = document.createElement("img");
        img.src = site.image;
        img.alt = `${site.title} preview`;
        img.loading = "lazy";
        img.decoding = "async";
        img.className = "project-preview-image";
        img.style.objectPosition = site.focal || "top center";
        media.appendChild(img);
      } else {
        const ph = document.createElement("div");
        ph.style.cssText = "color:#fff;text-align:center;font-size:1.5rem;font-weight:700;opacity:0.4;";
        ph.textContent = site.title.charAt(0);
        media.appendChild(ph);
      }

      // Accent line at top of media
      const accent = document.createElement("div");
      accent.style.cssText = `position:absolute;top:0;left:0;right:0;height:3px;background:${site.color};z-index:2;`;
      media.appendChild(accent);

      const content = document.createElement("div");
      content.className = "project-content";

      const kicker = document.createElement("span");
      kicker.className = "project-kicker";
      kicker.textContent = "Landing Page";

      const title = document.createElement("h3");
      title.className = "project-title";
      title.textContent = site.title;

      const desc = document.createElement("p");
      desc.className = "project-description";
      desc.textContent = site.description;

      const cta = document.createElement("span");
      cta.className = "project-link";
      cta.style.color = site.color;
      cta.textContent = "View project";

      content.append(kicker, title, desc, cta);
      link.append(media, content);
      card.appendChild(link);
      frag.appendChild(card);
    });

    grid.appendChild(frag);
  }

  /* ---- Init all ---- */
  function init() {
    if (document.body.dataset.appInit === "true") return;
    document.body.dataset.appInit = "true";

    try {
      initWebCollection();
      scheduleLoaderRemoval();
      initHeaderScroll();
      initSectionNavigation();
      initScrollAnimations();
      initProgressBar();
      initMobileMenu();
      initFAB();
      initSmoothScroll();
      initImageLoading();
      initMagneticButtons();
      initFAQ();
      createParticles();
    } catch (err) {
      console.error("Portfolio init error:", err);
      removeLoader();
    }
  }

  init();
});
