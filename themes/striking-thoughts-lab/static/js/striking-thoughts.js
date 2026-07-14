(() => {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  const body = doc.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const setupScrollInterface = () => {
    const rail = doc.querySelector("[data-scroll-progress]");
    const header = doc.querySelector("[data-lab-header]");
    let scheduled = false;

    const update = () => {
      const scrollTop = window.scrollY || root.scrollTop;
      const available = Math.max(1, root.scrollHeight - window.innerHeight);
      if (rail) rail.style.width = `${clamp((scrollTop / available) * 100, 0, 100)}%`;
      if (header) header.classList.toggle("is-scrolled", scrollTop > 18);
      scheduled = false;
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();
  };

  const setupNavigation = () => {
    const trigger = doc.querySelector("[data-nav-trigger]");
    const panel = doc.querySelector("[data-mobile-nav]");
    const closeControls = doc.querySelectorAll("[data-nav-close]");
    if (!trigger || !panel) return;

    const setOpen = (open) => {
      body.classList.toggle("nav-open", open);
      trigger.setAttribute("aria-expanded", String(open));
      panel.setAttribute("aria-hidden", String(!open));
      if (open) {
        const firstLink = panel.querySelector("a");
        if (firstLink) window.setTimeout(() => firstLink.focus(), 180);
      } else {
        trigger.focus({ preventScroll: true });
      }
    };

    trigger.addEventListener("click", () => setOpen(!body.classList.contains("nav-open")));
    closeControls.forEach((control) => control.addEventListener("click", () => setOpen(false)));
    panel.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
    doc.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && body.classList.contains("nav-open")) setOpen(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1120 && body.classList.contains("nav-open")) setOpen(false);
    }, { passive: true });
  };

  const setupIntro = () => {
    const intro = doc.querySelector("[data-lab-intro]");
    if (!intro) return;

    let seen = false;
    try {
      seen = window.sessionStorage.getItem("striking-thoughts-creative-deck-intro") === "seen";
    } catch (_) {
      seen = false;
    }

    if (seen || reduceMotion.matches) {
      intro.classList.add("is-skipped");
      intro.setAttribute("aria-hidden", "true");
      return;
    }

    body.classList.add("intro-active");
    intro.setAttribute("aria-hidden", "false");
    const finish = (skipped = false) => {
      intro.classList.add(skipped ? "is-skipped" : "is-complete");
      intro.setAttribute("aria-hidden", "true");
      body.classList.remove("intro-active");
      try {
        window.sessionStorage.setItem("striking-thoughts-creative-deck-intro", "seen");
      } catch (_) {
        // The animation still works when storage is unavailable.
      }
    };

    const timer = window.setTimeout(() => finish(false), 2600);
    const skip = intro.querySelector("[data-intro-skip]");
    if (skip) {
      skip.addEventListener("click", () => {
        window.clearTimeout(timer);
        finish(true);
      });
    }
  };

  const setupReveal = () => {
    const elements = [...doc.querySelectorAll(".reveal")];
    if (!elements.length) return;
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

    elements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
      observer.observe(element);
    });
  };

  const setupProjectFilters = () => {
    const consoleElement = doc.querySelector("[data-project-filter]");
    if (!consoleElement) return;

    const cards = [...consoleElement.querySelectorAll("[data-project-card]")];
    const input = consoleElement.querySelector("[data-project-search]");
    const searchPanel = consoleElement.querySelector("[data-filter-search]");
    const searchTrigger = consoleElement.querySelector("[data-search-trigger]");
    const tagButtons = [...consoleElement.querySelectorAll("[data-tag-filter]")];
    const visibleReadout = consoleElement.querySelector("[data-visible-count]");
    const empty = consoleElement.querySelector("[data-filter-empty]");
    let activeTag = "all";

    const filter = () => {
      const query = (input?.value || "").trim().toLowerCase();
      let visible = 0;
      cards.forEach((card) => {
        const tags = (card.dataset.tags || "").split("|");
        const title = card.dataset.title || "";
        const matchesTag = activeTag === "all" || tags.includes(activeTag);
        const matchesQuery = !query || title.includes(query) || tags.some((tag) => tag.includes(query));
        const show = matchesTag && matchesQuery;
        card.classList.toggle("is-filtered", !show);
        if (show) visible += 1;
      });
      if (visibleReadout) visibleReadout.textContent = String(visible);
      if (empty) empty.hidden = visible !== 0;
    };

    if (searchTrigger && searchPanel && input) {
      searchTrigger.addEventListener("click", () => {
        const open = !searchPanel.classList.contains("is-open");
        searchPanel.classList.toggle("is-open", open);
        searchTrigger.setAttribute("aria-expanded", String(open));
        if (open) window.setTimeout(() => input.focus(), 180);
        if (!open && !input.value) input.blur();
      });
      input.addEventListener("input", filter);
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        input.value = "";
        searchPanel.classList.remove("is-open");
        searchTrigger.setAttribute("aria-expanded", "false");
        searchTrigger.focus();
        filter();
      });
    }

    tagButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeTag = button.dataset.tagFilter || "all";
        tagButtons.forEach((candidate) => candidate.classList.toggle("is-active", candidate === button));
        filter();
      });
    });
  };

  const setupCarousels = () => {
    doc.querySelectorAll("[data-carousel]").forEach((carousel) => {
      const viewport = carousel.querySelector("[data-carousel-viewport]");
      const slides = [...carousel.querySelectorAll("[data-carousel-slide]")];
      const dots = [...carousel.querySelectorAll("[data-carousel-dot]")];
      const previous = carousel.querySelector("[data-carousel-prev]");
      const next = carousel.querySelector("[data-carousel-next]");
      if (!viewport || slides.length < 2) return;

      let index = 0;
      let timer = 0;
      let scrollTimer = 0;
      const interval = Math.max(1800, Number.parseInt(carousel.dataset.interval || "4200", 10));

      const updateDots = () => dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
      const go = (target, smooth = true) => {
        index = (target + slides.length) % slides.length;
        viewport.scrollTo({ left: viewport.clientWidth * index, behavior: smooth ? "smooth" : "auto" });
        updateDots();
      };
      const stop = () => window.clearInterval(timer);
      const start = () => {
        stop();
        if (!reduceMotion.matches) timer = window.setInterval(() => go(index + 1), interval);
      };

      previous?.addEventListener("click", () => { go(index - 1); start(); });
      next?.addEventListener("click", () => { go(index + 1); start(); });
      dots.forEach((dot, dotIndex) => dot.addEventListener("click", () => { go(dotIndex); start(); }));
      carousel.addEventListener("pointerenter", stop);
      carousel.addEventListener("pointerleave", start);
      carousel.addEventListener("focusin", stop);
      carousel.addEventListener("focusout", start);
      viewport.addEventListener("scroll", () => {
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(() => {
          index = clamp(Math.round(viewport.scrollLeft / Math.max(1, viewport.clientWidth)), 0, slides.length - 1);
          updateDots();
        }, 90);
      }, { passive: true });
      window.addEventListener("resize", () => go(index, false), { passive: true });
      start();
    });
  };

  const setupCardDepth = () => {
    if (reduceMotion.matches || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    doc.querySelectorAll("[data-project-card]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${y * -2.8}deg) rotateY(${x * 3.2}deg) translateY(-3px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  };

  const setupThoughtField = () => {
    const canvas = doc.querySelector("[data-thought-field]");
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const pointer = { x: -1000, y: -1000, active: false };
    let width = 0;
    let height = 0;
    let ratio = 1;
    let nodes = [];
    let frame = 0;

    const makeNodes = () => {
      const count = clamp(Math.round((width * height) / 31000), 24, 68);
      nodes = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.11,
        vy: (Math.random() - 0.5) * 0.11,
        radius: Math.random() * 1.15 + 0.35,
        purple: index % 11 === 0,
      }));
    };

    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      makeNodes();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      nodes.forEach((node, nodeIndex) => {
        if (!reduceMotion.matches) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < -12) node.x = width + 12;
          if (node.x > width + 12) node.x = -12;
          if (node.y < -12) node.y = height + 12;
          if (node.y > height + 12) node.y = -12;

          if (pointer.active) {
            const dx = pointer.x - node.x;
            const dy = pointer.y - node.y;
            const distance = Math.hypot(dx, dy);
            if (distance < 135 && distance > 0) {
              node.x -= (dx / distance) * 0.12;
              node.y -= (dy / distance) * 0.12;
            }
          }
        }

        for (let otherIndex = nodeIndex + 1; otherIndex < nodes.length; otherIndex += 1) {
          const other = nodes[otherIndex];
          const distance = Math.hypot(node.x - other.x, node.y - other.y);
          if (distance > 118) continue;
          context.strokeStyle = `rgba(88, 244, 240, ${(1 - distance / 118) * 0.085})`;
          context.lineWidth = 0.65;
          context.beginPath();
          context.moveTo(node.x, node.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }

        context.fillStyle = node.purple ? "rgba(168, 117, 255, .38)" : "rgba(88, 244, 240, .36)";
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fill();
      });

      if (!reduceMotion.matches) frame = window.requestAnimationFrame(draw);
    };

    window.addEventListener("pointermove", (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }, { passive: true });
    doc.addEventListener("pointerleave", () => { pointer.active = false; });
    window.addEventListener("resize", resize, { passive: true });
    doc.addEventListener("visibilitychange", () => {
      if (doc.hidden) {
        window.cancelAnimationFrame(frame);
      } else if (!reduceMotion.matches) {
        frame = window.requestAnimationFrame(draw);
      }
    });

    resize();
    draw();
  };

  setupScrollInterface();
  setupNavigation();
  setupIntro();
  setupReveal();
  setupProjectFilters();
  setupCarousels();
  setupCardDepth();
  setupThoughtField();
})();
