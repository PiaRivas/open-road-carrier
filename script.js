(function () {
  const track = document.querySelector(".slides-track");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const navLinks = Array.from(document.querySelectorAll("[data-slide]"));
  const progress = document.querySelector(".slide-progress");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let current = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.setAttribute("role", "button");
    dot.setAttribute("tabindex", "0");
    dot.setAttribute("aria-label", "Go to section " + (i + 1));
    dot.addEventListener("click", () => goTo(i));
    dot.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goTo(i);
      }
    });
    progress.appendChild(dot);
  });
  const dots = Array.from(progress.children);

  function goTo(index) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    current = index;
    track.style.transform = `translateX(-${index * 100}vw)`;

    navLinks.forEach((link) => {
      link.classList.toggle("active", Number(link.dataset.slide) === index);
    });
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));

    history.replaceState(null, "", "#" + slides[index].id);
    slides[index].scrollTop = 0;

    if (slides[index].id === "slide-home") {
      animateStats();
    }
  }

  // Count up the hero stats from 0 to their real, disclosed values the first
  // time the hero slide is shown, instead of just printing static text.
  let statsAnimated = false;
  function animateStats() {
    if (statsAnimated) return;
    statsAnimated = true;
    const counters = Array.from(document.querySelectorAll(".stat-count"));
    if (reduceMotion.matches) {
      counters.forEach((el) => {
        const target = parseFloat(el.dataset.target);
        const decimals = Number(el.dataset.decimals) || 0;
        el.textContent = target.toFixed(decimals) + el.dataset.suffix;
      });
      return;
    }
    const duration = 1200;
    const start = performance.now();
    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      counters.forEach((el) => {
        const target = parseFloat(el.dataset.target);
        const decimals = Number(el.dataset.decimals) || 0;
        el.textContent = (target * eased).toFixed(decimals) + el.dataset.suffix;
      });
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      goTo(Number(link.dataset.slide));
    });
  });

  document.addEventListener("keydown", (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "ArrowRight") goTo(current + 1);
    if (e.key === "ArrowLeft") goTo(current - 1);
  });

  // Swipe to change slides, but back off near the screen edges and on mostly
  // vertical gestures so we don't fight the browser's own back/forward swipe
  // gesture or a normal vertical scroll inside a tall slide.
  const EDGE_ZONE = 24;
  const SWIPE_THRESHOLD = 60;
  let touchStart = null;

  document.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (e) => {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      const startedAtEdge = touchStart.x < EDGE_ZONE || touchStart.x > window.innerWidth - EDGE_ZONE;
      const isHorizontalIntent = Math.abs(dx) > Math.abs(dy) * 1.5;

      if (!startedAtEdge && isHorizontalIntent && Math.abs(dx) > SWIPE_THRESHOLD) {
        goTo(dx < 0 ? current + 1 : current - 1);
      }
      touchStart = null;
    },
    { passive: true }
  );

  const initialIndex = slides.findIndex((s) => s.id === location.hash.slice(1));
  goTo(initialIndex >= 0 ? initialIndex : 0);

  const heroVideo = document.querySelector(".hero-video");
  if (reduceMotion.matches && heroVideo) {
    heroVideo.pause();
  }

  const calcAmount = document.getElementById("calc-amount");
  const calcAmountDisplay = document.getElementById("calc-amount-display");
  const calcFixedValue = document.getElementById("calc-fixed-value");
  if (calcAmount) {
    const formatUSD = (n) => Math.round(n).toLocaleString("en-US");
    function updateCalculator() {
      const amount = Number(calcAmount.value);
      calcAmountDisplay.textContent = formatUSD(amount);
      // The Fixed Annual Return is a disclosed, contractual 20% — this is a
      // direct calculation, not a projection. The Profit-Sharing side stays
      // qualitative because it depends on each truck's real performance.
      calcFixedValue.textContent = formatUSD(amount * 0.2);
    }
    calcAmount.addEventListener("input", updateCalculator);
    updateCalculator();
  }

  const form = document.getElementById("contact-form");
  const success = document.getElementById("form-success");
  const errorMsg = document.getElementById("form-error");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorMsg.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Request failed");
        form.hidden = true;
        success.hidden = false;
        success.focus?.();
      })
      .catch(() => {
        errorMsg.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = "Send";
      });
  });
})();
