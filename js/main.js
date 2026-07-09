const siteConfig = window.siteConfig || {};

function phoneHref(phone) {
  return `tel:${String(phone || "").replace(/[^0-9+]/g, "")}`;
}

function applyConfigText() {
  const title = document.querySelector("title[data-config-title]");
  if (title?.dataset.configTitle) {
    title.textContent = title.dataset.configTitle
      .replaceAll("{companyName}", siteConfig.companyName || "")
      .replaceAll("{shortName}", siteConfig.shortName || siteConfig.companyName || "");
  }

  const values = {
    brandText: siteConfig.shortName,
    email: siteConfig.email,
    website: siteConfig.domain,
    phone: siteConfig.phone,
    phoneLabel: siteConfig.phoneLabel,
    address: siteConfig.address,
    footerText: siteConfig.footerText,
    footerCompanyLine: siteConfig.footerCompanyLine,
    copyright: siteConfig.copyright,
    disclaimer: siteConfig.disclaimer
  };

  document.querySelectorAll("[data-config]").forEach((el) => {
    const key = el.dataset.config;
    const value = values[key];
    if (!value) return;

    el.textContent = value;

    if (key === "email" && el.tagName === "A") {
      el.setAttribute("href", `mailto:${siteConfig.email}`);
    }

    if (key === "phone" && el.tagName === "A") {
      el.setAttribute("href", phoneHref(siteConfig.phone));
    }

    if (key === "website" && el.tagName === "A") {
      el.setAttribute("href", siteConfig.website);
    }
  });

  document.querySelectorAll("[data-config-href]").forEach((el) => {
    const key = el.dataset.configHref;
    if (key === "email") {
      el.setAttribute("href", `mailto:${siteConfig.email || ""}`);
    }

    if (key === "phone") {
      el.setAttribute("href", phoneHref(siteConfig.phone));
    }

    if (key === "website") {
      el.setAttribute("href", siteConfig.website || "#");
    }
  });

  document.querySelectorAll("[data-modal-company]").forEach((el) => {
    el.textContent = siteConfig.companyName || "";
  });

  document.querySelectorAll("[data-modal-email]").forEach((el) => {
    el.textContent = siteConfig.email || "";
    el.setAttribute("href", `mailto:${siteConfig.email || ""}`);
  });

  document.querySelectorAll("[data-floating-cta]").forEach((el) => {
    el.setAttribute("href", phoneHref(siteConfig.phone));
    el.setAttribute("aria-label", `Call ${siteConfig.companyName || "the company"} at ${siteConfig.phone || ""}`);
  });
}

function initHeaderBehavior() {
  const header = document.querySelector("[data-header]");
  const panel = document.querySelector("[data-mobile-panel]");
  const overlay = document.querySelector("[data-menu-overlay]");
  const openBtn = document.querySelector("[data-menu-open]");
  const closeBtn = document.querySelector("[data-menu-close]");
  const mobileServicesToggle = panel?.querySelector("[data-mobile-services-toggle]");
  const mobileServicesMenu = panel?.querySelector("[data-mobile-services-menu]");
  if (!header) return;

  const setMobileServicesOpen = (isOpen) => {
    mobileServicesToggle?.setAttribute("aria-expanded", isOpen ? "true" : "false");
    mobileServicesMenu?.classList.toggle("is-open", isOpen);
  };

  const syncHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  };

  const open = () => {
    setMobileServicesOpen(false);
    panel?.classList.add("is-open");
    overlay?.classList.add("is-open");
    panel?.setAttribute("aria-hidden", "false");
  };

  const close = () => {
    panel?.classList.remove("is-open");
    overlay?.classList.remove("is-open");
    panel?.setAttribute("aria-hidden", "true");
    setMobileServicesOpen(false);
  };

  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  overlay?.addEventListener("click", close);
  mobileServicesToggle?.addEventListener("click", () => {
    setMobileServicesOpen(!mobileServicesMenu?.classList.contains("is-open"));
  });
  panel?.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
}

function initFloatingCta() {
  const cta = document.querySelector("[data-floating-cta]");
  if (!cta) return;

  const sync = () => {
    cta.classList.toggle("is-visible", window.scrollY > 180);
  };

  sync();
  window.addEventListener("scroll", sync, { passive: true });
}

function initCookieBanner() {
  const banner = document.querySelector("[data-cookie-banner]");
  if (!banner) return;

  const storageKey = "voltlinkCookieConsent";
  const acceptBtn = banner.querySelector("[data-cookie-accept]");
  const declineBtn = banner.querySelector("[data-cookie-decline]");

  const getStoredChoice = () => {
    try {
      return window.localStorage.getItem(storageKey);
    } catch (error) {
      const match = document.cookie.match(new RegExp(`(?:^|; )${storageKey}=([^;]+)`));
      return match ? decodeURIComponent(match[1]) : null;
    }
  };

  const setStoredChoice = (choice) => {
    try {
      window.localStorage.setItem(storageKey, choice);
    } catch (error) {
      document.cookie = `${storageKey}=${choice}; path=/; max-age=15552000; SameSite=Lax`;
    }
  };

  const close = (choice) => {
    setStoredChoice(choice);
    banner.classList.remove("is-visible");
    window.setTimeout(() => {
      banner.hidden = true;
    }, 240);
  };

  if (!getStoredChoice()) {
    banner.hidden = false;
    window.requestAnimationFrame(() => {
      banner.classList.add("is-visible");
    });
  }

  acceptBtn?.addEventListener("click", () => close("accepted"));
  declineBtn?.addEventListener("click", () => close("declined"));
}

function initAccordions() {
  const accordions = document.querySelectorAll("details.faq-item");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!accordions.length || reduceMotion) return;

  accordions.forEach((details) => {
    const summary = details.querySelector("summary");
    if (!summary) return;

    let animation = null;

    const getClosedHeight = () => {
      const styles = window.getComputedStyle(details);
      const paddingY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      return `${summary.offsetHeight + paddingY}px`;
    };

    const runAnimation = (startHeight, endHeight, shouldOpen) => {
      details.style.height = startHeight;
      details.style.overflow = "hidden";
      animation?.cancel();

      animation = details.animate({
        height: [startHeight, endHeight]
      }, {
        duration: 280,
        easing: "cubic-bezier(.22,.61,.36,1)"
      });

      animation.onfinish = () => {
        details.open = shouldOpen;
        details.style.height = "";
        details.style.overflow = "";
        animation = null;
      };
    };

    summary.addEventListener("click", (event) => {
      event.preventDefault();

      const startHeight = `${details.offsetHeight}px`;

      if (details.open) {
        runAnimation(startHeight, getClosedHeight(), false);
        return;
      }

      details.open = true;
      runAnimation(startHeight, `${details.scrollHeight}px`, true);
    });
  });
}

function initForms() {
  const modal = document.querySelector("[data-form-modal]");
  const dialog = modal?.querySelector(".form-modal-dialog");
  const closeControls = modal?.querySelectorAll("[data-modal-close]") || [];
  let lastFocused = null;

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    lastFocused?.focus?.();
  };

  const openModal = (trigger) => {
    if (!modal || !dialog) return false;
    applyConfigText();
    lastFocused = trigger || document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.setTimeout(() => dialog.focus(), 30);
    return true;
  };

  closeControls.forEach((control) => control.addEventListener("click", closeModal));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal?.classList.contains("is-open")) {
      closeModal();
    }
  });

  document.querySelectorAll("form[data-contact-form]").forEach((form) => {
    const message = form.querySelector(".success-message");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const opened = openModal(form.querySelector("button[type='submit']"));
      if (message && !opened) {
        message.textContent = `Thanks. ${siteConfig.companyName} received your request and will use ${siteConfig.email} for follow-up details.`;
        message.classList.add("is-visible");
      }
      form.reset();
    });
  });
}

function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const animate = (el) => {
    const target = Number(el.dataset.count || 0);
    const started = performance.now();
    const duration = 1300;

    const tick = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach((counter) => observer.observe(counter));
}

function initMotion() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
    return;
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".reveal").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) {
        gsap.set(el, { autoAlpha: 1, y: 0, clearProps: "opacity,visibility,transform" });
        return;
      }

      gsap.fromTo(el, {
        autoAlpha: 0,
        y: 42
      }, {
        autoAlpha: 1,
        y: 0,
        duration: 1.05,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 86%"
        }
      });
    });

    gsap.utils.toArray(".hero-bg, .page-hero-bg").forEach((img) => {
      gsap.to(img, {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: img.parentElement,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    });

    const progressFills = gsap.utils.toArray(".progress-fill");
    if (progressFills.length) {
      gsap.fromTo(progressFills, {
        width: "0%"
      }, {
        width: "100%",
        duration: 1.2,
        delay: 0.4,
        ease: "power3.out"
      });
    }
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = "none";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    document.querySelectorAll(".progress-fill").forEach((el) => {
      window.setTimeout(() => {
        el.style.transition = "width 1.2s ease";
        el.style.width = "100%";
      }, 400);
    });
  }
}

function initSwiper() {
  const el = document.querySelector(".testimonial-swiper");
  if (!el || !window.Swiper) return;

  const slideCount = el.querySelectorAll(".swiper-slide").length;
  new Swiper(el, {
    loop: slideCount > 3,
    speed: 650,
    spaceBetween: 24,
    slidesPerView: 1,
    autoplay: {
      delay: 4200,
      disableOnInteraction: false
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true
    },
    breakpoints: {
      800: { slidesPerView: 2 },
      1180: { slidesPerView: 3 }
    }
  });
}

function initMagneticButtons() {
  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
    });
  });
}

function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyConfigText();
  initLucide();
  initHeaderBehavior();
  initFloatingCta();
  initCookieBanner();
  initAccordions();
  initForms();
  initCounters();
  initMotion();
  initSwiper();
  initMagneticButtons();
});
