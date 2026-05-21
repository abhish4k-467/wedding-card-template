import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Config ───────────────────────────────────────────────────────────────────
const frameCount = 161;
const images = new Array(frameCount).fill(null);
const frameObj = { frame: 1 };

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const canvas = document.getElementById("invitation-canvas");
const ctx = canvas.getContext("2d");
const rsvpForm = document.getElementById("rsvp-form");
const acceptBtn = document.getElementById("rsvp-accept");
const declineBtn = document.getElementById("rsvp-decline");
const dietContainer = document.getElementById("diet-container");
const rsvpSuccess = document.getElementById("rsvp-success");
let selectedAttendance = null;

// ─── Frame path ───────────────────────────────────────────────────────────────
const getFramePath = (i) =>
  `./hero_frames/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;

// ─── 1. Preloader ─────────────────────────────────────────────────────────────
const CRITICAL_COUNT = 25;

function preloadImages() {
  return new Promise((resolve) => {
    let critDone = 0;
    let resolved = false;

    function onCritLoad() {
      critDone++;
      const pct = Math.min(100, Math.round((critDone / CRITICAL_COUNT) * 100));
      const bar = document.getElementById("loader-bar");
      const lbl = document.getElementById("loader-percentage");
      if (bar) bar.style.width = pct + "%";
      if (lbl) lbl.textContent = pct + "%";
      if (critDone >= CRITICAL_COUNT && !resolved) {
        resolved = true;
        resolve();
        loadRemaining();
      }
    }

    for (let i = 1; i <= CRITICAL_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { images[i - 1] = img; onCritLoad(); };
      img.onerror = onCritLoad;
      img.src = getFramePath(i);
    }
  });
}

function loadRemaining() {
  const BATCH = 10;
  let cursor = CRITICAL_COUNT + 1;

  function loadBatch() {
    if (cursor > frameCount) return;
    let pending = 0;
    const end = Math.min(cursor + BATCH - 1, frameCount);

    for (let i = cursor; i <= end; i++) {
      pending++;
      const img = new Image();
      img.decoding = "async";
      const idx = i;
      img.onload = () => {
        images[idx - 1] = img;
        pending--;
        if (pending === 0) { cursor = end + 1; loadBatch(); }
      };
      img.onerror = () => {
        pending--;
        if (pending === 0) { cursor = end + 1; loadBatch(); }
      };
      img.src = getFramePath(i);
    }
  }

  loadBatch();
}

// ─── 2. Canvas sizing ─────────────────────────────────────────────────────────
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ─── 3. Draw frame ────────────────────────────────────────────────────────────
function drawFrame(idx) {
  idx = Math.max(1, Math.min(frameCount, Math.round(idx)));

  let img = images[idx - 1];
  if (!img) {
    for (let i = idx - 2; i >= 0; i--) {
      if (images[i]) { img = images[i]; break; }
    }
    if (!img) {
      for (let i = idx; i < frameCount; i++) {
        if (images[i]) { img = images[i]; break; }
      }
    }
  }
  if (!img || !img.naturalWidth) return;

  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(w / iw, h / ih);
  const nw = iw * scale;
  const nh = ih * scale;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, iw, ih, (w - nw) / 2, (h - nh) / 2, nw, nh);
}

// ─── 4. Hero scroll animation ─────────────────────────────────────────────────
function initScrollAnimations() {
  // Prevent GSAP from causing layout jumps on mobile browsers
  ScrollTrigger.config({ ignoreMobileResize: true });
  ScrollTrigger.normalizeScroll(true);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#animation-viewport",
      start: "top top",
      end: "+=500%",
      scrub: 0.5,
      pin: true,
      // No anticipatePin — it causes scroll-up glitches
      pinType: "transform" // Often helps prevent jumping when pinning inside a standard scroll
    }
  });

  tl.to(frameObj, {
    frame: frameCount, snap: "frame", ease: "none", duration: 4,
    onUpdate: () => drawFrame(frameObj.frame),
  }, 0);

  tl.to("#scroll-indicator", { opacity: 0, y: 20, duration: 0.3 }, 0.05);

  tl.to("#layer-1", {
    opacity: 0, filter: "blur(20px)", y: -80, duration: 0.6, ease: "power2.inOut",
  }, 0.35);

  gsap.set("#layer-2", { opacity: 0, filter: "blur(20px)", y: 80 });
  tl.to("#layer-2", { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.6, ease: "power2.out" }, 0.9);
  tl.to("#layer-2", { opacity: 0, filter: "blur(20px)", y: -80, duration: 0.6, ease: "power2.in" }, 1.7);

  gsap.set("#layer-3", { opacity: 0, filter: "blur(20px)", y: 80 });
  tl.to("#layer-3", { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.6, ease: "power2.out" }, 2.3);
  tl.to("#layer-3", { opacity: 0, filter: "blur(20px)", y: -80, duration: 0.6, ease: "power2.in" }, 3.1);

  gsap.set("#layer-4", { opacity: 0, filter: "blur(20px)", y: 80 });
  tl.to("#layer-4", { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.6, ease: "power2.out" }, 3.6);
}

// ─── 5. Section reveals via IntersectionObserver (NOT GSAP) ───────────────────
// Uses native browser API — zero dependency on GSAP layout calculations.
// Works reliably regardless of hero pin state.
function initSectionReveals() {
  const revealElements = document.querySelectorAll(
    ".story-card, .gallery-item, .blessing-card"
  );

  // Add the hidden class immediately
  revealElements.forEach((el) => {
    el.classList.add("reveal-hidden");
  });

  // Observe — reveal as soon as element enters viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          entry.target.classList.remove("reveal-hidden");
          observer.unobserve(entry.target); // Only reveal once
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px 50px 0px" }
    // threshold 0 = fires the instant ANY part enters viewport
    // rootMargin 50px = starts 50px BEFORE element enters (pre-reveal)
  );

  revealElements.forEach((el) => observer.observe(el));
}

// ─── 6. Smooth anchor navigation ──────────────────────────────────────────────
function initSmoothAnchorScroll() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

// ─── 7. Particles ─────────────────────────────────────────────────────────────
function createParticles() {
  const container = document.getElementById("particles-overlay");
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const w = Math.random() * 8 + 6;
    const delay = Math.random() * 12;
    p.style.cssText = `width:${w}px;height:${w * (Math.random() * 0.4 + 1.3)}px;left:${Math.random() * 100}%;bottom:${Math.random() * -10}%;opacity:${Math.random() * 0.5 + 0.4};animation-delay:${delay}s,${delay}s;animation-duration:${Math.random() * 10 + 12}s,${Math.random() * 3 + 3}s;`;
    container.appendChild(p);
  }
}

// ─── 8. RSVP ──────────────────────────────────────────────────────────────────
function initRSVPEvents() {
  if (!acceptBtn || !declineBtn || !rsvpForm) return;

  acceptBtn.addEventListener("click", () => {
    selectedAttendance = "accept";
    acceptBtn.classList.add("selected");
    declineBtn.classList.remove("selected");
    dietContainer.style.maxHeight = "120px";
  });

  declineBtn.addEventListener("click", () => {
    selectedAttendance = "decline";
    declineBtn.classList.add("selected");
    acceptBtn.classList.remove("selected");
    dietContainer.style.maxHeight = "0px";
  });

  rsvpForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!selectedAttendance) { alert("Please select your attendance preference."); return; }
    gsap.to(rsvpForm, {
      opacity: 0, y: -20, duration: 0.5,
      onComplete: () => {
        rsvpForm.classList.add("hidden");
        rsvpSuccess.classList.remove("hidden");
        gsap.fromTo(rsvpSuccess, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" });
      }
    });
  });
}

// ─── 9. Audio Controls ──────────────────────────────────────────────────────────
function initAudioControls() {
  const bgAudio = document.getElementById("bg-audio");
  const muteBtn = document.getElementById("mute-btn");
  const iconUnmuted = document.getElementById("icon-unmuted");
  const iconMuted = document.getElementById("icon-muted");

  if (!bgAudio || !muteBtn) return;

  bgAudio.volume = 0.5; // Set an initial reasonable volume

  muteBtn.addEventListener("click", () => {
    if (bgAudio.muted) {
      bgAudio.muted = false;
      iconMuted.classList.add("hidden");
      iconUnmuted.classList.remove("hidden");
    } else {
      bgAudio.muted = true;
      iconUnmuted.classList.add("hidden");
      iconMuted.classList.remove("hidden");
    }
  });

  return {
    play: () => {
      bgAudio.play().catch(e => console.warn("Audio play blocked:", e));
      gsap.to(muteBtn, { opacity: 1, duration: 1, ease: "power2.out" });
    }
  };
}

// ─── Resize handler ───────────────────────────────────────────────────────────
let _lastWinHeight = window.innerHeight;
window.addEventListener("resize", () => { 
  // Only resize canvas if height changes significantly (ignores mobile address bar mostly) or width changes
  if (Math.abs(window.innerHeight - _lastWinHeight) > 60 || window.innerWidth !== canvas.width / (window.devicePixelRatio || 1)) {
    resizeCanvas(); 
    drawFrame(frameObj.frame); 
    _lastWinHeight = window.innerHeight;
  }
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  resizeCanvas();
  initSmoothAnchorScroll();

  // Hide sections immediately (before anything is visible)
  initSectionReveals();

  preloadImages().then(() => {
    drawFrame(1);

    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("main-content");
    const progressContainer = document.getElementById("loader-progress-container");
    const openBtn = document.getElementById("open-invitation-btn");

    initRSVPEvents();
    const audioControls = initAudioControls();

    if (progressContainer && openBtn) {
      progressContainer.style.display = "none";
      openBtn.classList.remove("hidden");
      
      openBtn.addEventListener("click", () => {
        if (audioControls) audioControls.play();
        
        gsap.to(loader, {
          opacity: 0, duration: 0.8, ease: "power3.inOut",
          onComplete: () => { loader.style.display = "none"; createParticles(); }
        });

        gsap.to(mainContent, {
          opacity: 1, duration: 0.8, ease: "power2.out",
          onComplete: () => {
            initScrollAnimations();

            gsap.fromTo("#layer-1 > *",
              { opacity: 0, y: 20, filter: "blur(10px)" },
              { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, stagger: 0.15, ease: "power3.out" }
            );
          }
        });
      });
    } else {
      if (audioControls) audioControls.play();
      gsap.to(loader, {
        opacity: 0, duration: 0.8, ease: "power3.inOut",
        onComplete: () => { loader.style.display = "none"; createParticles(); }
      });

      gsap.to(mainContent, {
        opacity: 1, duration: 0.8, ease: "power2.out",
        onComplete: () => {
          initScrollAnimations();

          gsap.fromTo("#layer-1 > *",
            { opacity: 0, y: 20, filter: "blur(10px)" },
            { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, stagger: 0.15, ease: "power3.out" }
          );
        }
      });
    }
  });
});
