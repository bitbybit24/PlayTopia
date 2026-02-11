const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
const cursor = document.querySelector('.cursor');
const cursorGlow = document.querySelector('.cursor-glow');
const cursorCore = document.querySelector('.cursor-core');
const splash = document.getElementById('splash');
const timerElements = {
  days: document.querySelector('[data-timer="days"]'),
  hours: document.querySelector('[data-timer="hours"]'),
  minutes: document.querySelector('[data-timer="minutes"]'),
  seconds: document.querySelector('[data-timer="seconds"]'),
};

const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = {
  width: 0,
  height: 0,
  particles: [],
  mouse: {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    active: false,
    autoActive: false,
    lastMove: 0,
  },
};

const config = {
  particleCount: 200,
  maxLinkDistance: 160,
  baseSpeed: 0.2,
  driftStrength: 0.15,
  attractionRadius: 140,
  attractionStrength: 0.6,
  returnEase: 0.02,
  mouseEase: 0.12,
};

if (isTouchDevice) {
  config.particleCount = 25;
  config.maxLinkDistance = 30;
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = state.width * dpr;
  canvas.height = state.height * dpr;
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createParticles() {
  state.particles = Array.from({ length: config.particleCount }, () => {
    const ox = Math.random() * state.width;
    const oy = Math.random() * state.height;
    return {
      x: ox,
      y: oy,
      ox,
      oy,
      vx: (Math.random() - 0.5) * config.baseSpeed,
      vy: (Math.random() - 0.5) * config.baseSpeed,
    };
  });
}

function updateParticles() {
  if (state.mouse.active && state.mouse.lastMove) {
    if (Date.now() - state.mouse.lastMove > 1200) {
      state.mouse.active = false;
    }
  }
  if (!state.mouse.active && !prefersReducedMotion) {
    const t = Date.now() * 0.0002;
    const rx = state.width * 0.24;
    const ry = state.height * 0.2;
    state.mouse.targetX = state.width / 2 + Math.cos(t) * rx;
    state.mouse.targetY = state.height / 2 + Math.sin(t * 1.3) * ry;
    state.mouse.autoActive = true;
  } else {
    state.mouse.autoActive = false;
  }

  state.mouse.x += (state.mouse.targetX - state.mouse.x) * config.mouseEase;
  state.mouse.y += (state.mouse.targetY - state.mouse.y) * config.mouseEase;

  for (const p of state.particles) {
  const idleBoost = state.mouse.autoActive ? 1.6 : 1;
  p.vx += (Math.random() - 0.5) * config.driftStrength * 0.03 * idleBoost;
  p.vy += (Math.random() - 0.5) * config.driftStrength * 0.03 * idleBoost;

    if (state.mouse.active || state.mouse.autoActive) {
      const dx = state.mouse.x - p.x;
      const dy = state.mouse.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < config.attractionRadius) {
  const strength = state.mouse.active ? config.attractionStrength : config.attractionStrength * 0.45;
        const force = (1 - dist / config.attractionRadius) * strength;
        p.vx += (dx / (dist || 1)) * force;
        p.vy += (dy / (dist || 1)) * force;
      }
    }

  const returnEase = state.mouse.autoActive ? config.returnEase * 0.6 : config.returnEase;
  p.vx += (p.ox - p.x) * returnEase;
  p.vy += (p.oy - p.y) * returnEase;

    p.vx *= 0.92;
    p.vy *= 0.92;

    p.x += p.vx;
    p.y += p.vy;
  }
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);

  for (let i = 0; i < state.particles.length; i++) {
    const a = state.particles[i];

  ctx.beginPath();
  ctx.arc(a.x, a.y, 1.8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();

    for (let j = i + 1; j < state.particles.length; j++) {
      const b = state.particles[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < config.maxLinkDistance) {
        const alpha = (1 - d / config.maxLinkDistance) * 0.7;
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = `rgba(148,163,184,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
}

function animate() {
  updateParticles();
  draw();
  requestAnimationFrame(animate);
}

const eventStart = new Date('2026-02-26T10:00:00');

function updateTimer() {
  if (!timerElements.days) return;
  const now = new Date();
  let diff = eventStart.getTime() - now.getTime();

  if (diff <= 0) {
    timerElements.days.textContent = '00';
    timerElements.hours.textContent = '00';
    timerElements.minutes.textContent = '00';
    timerElements.seconds.textContent = '00';
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  timerElements.days.textContent = String(days).padStart(2, '0');
  timerElements.hours.textContent = String(hours).padStart(2, '0');
  timerElements.minutes.textContent = String(minutes).padStart(2, '0');
  timerElements.seconds.textContent = String(seconds).padStart(2, '0');
}

const cursorState = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  targetX: window.innerWidth / 2,
  targetY: window.innerHeight / 2,
  glowX: window.innerWidth / 2,
  glowY: window.innerHeight / 2,
  coreEase: 0.18,
  glowEase: 0.08,
  fadeTimeout: null,
};

function showCursor() {
  if (!cursor) return;
  cursor.classList.add('visible');
}

function hideCursor() {
  if (!cursor) return;
  cursor.classList.remove('visible');
}

function updateCursor() {
  cursorState.x += (cursorState.targetX - cursorState.x) * cursorState.coreEase;
  cursorState.y += (cursorState.targetY - cursorState.y) * cursorState.coreEase;
  cursorState.glowX += (cursorState.targetX - cursorState.glowX) * cursorState.glowEase;
  cursorState.glowY += (cursorState.targetY - cursorState.glowY) * cursorState.glowEase;

  if (cursorGlow) {
    cursorGlow.style.transform = `translate3d(${cursorState.glowX}px, ${cursorState.glowY}px, 0) translate3d(-50%, -50%, 0)`;
  }
  if (cursorCore) {
    cursorCore.style.transform = `translate3d(${cursorState.x}px, ${cursorState.y}px, 0) translate3d(-50%, -50%, 0)`;
  }

  requestAnimationFrame(updateCursor);
}

// Nav behavior
const navbar = document.querySelector('.navbar');
const navLinks = document.querySelector('.nav-links');
const navToggle = document.querySelector('.nav-toggle');

function setNavState() {
  if (window.scrollY > 24) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
}

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

window.addEventListener('scroll', setNavState);
setNavState();

// Close mobile nav on link click
navLinks.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') navLinks.classList.remove('open');
});

// Reveal on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('.glass, .section-head, .game-card, .aim-card').forEach((el) => {
  el.classList.add('reveal');
  observer.observe(el);
});

// Canvas interactions
window.addEventListener('resize', () => {
  resizeCanvas();
  createParticles();
});

window.addEventListener('mousemove', (e) => {
  state.mouse.targetX = e.clientX;
  state.mouse.targetY = e.clientY;
  state.mouse.active = true;
  state.mouse.lastMove = Date.now();
  if (!isTouchDevice) {
    cursorState.targetX = e.clientX;
    cursorState.targetY = e.clientY;
    showCursor();
    if (cursorState.fadeTimeout) clearTimeout(cursorState.fadeTimeout);
    cursorState.fadeTimeout = setTimeout(() => {
      cursor.classList.remove('visible');
    }, 1400);
  }
});

window.addEventListener('mouseleave', () => {
  state.mouse.active = false;
  if (!isTouchDevice) hideCursor();
});

window.addEventListener('mouseenter', () => {
  if (!isTouchDevice) showCursor();
});

resizeCanvas();
createParticles();
animate();

updateTimer();
setInterval(updateTimer, 1000);

if (!isTouchDevice) {
  showCursor();
  requestAnimationFrame(updateCursor);
}

if (splash) {
  const totalDuration = prefersReducedMotion ? 400 : 2400;
  const fadeDelay = prefersReducedMotion ? 200 : 2000;

  window.setTimeout(() => {
    splash.classList.add('hidden');
  }, fadeDelay);

  window.setTimeout(() => {
    splash.remove();
  }, totalDuration);
}

// Past edition sliders
const pastVideos = Array.from(document.querySelectorAll('.video-slide'));
const pastVideoDots = document.querySelector('.video-dots');
const pastVideoToggle = document.querySelector('.video-toggle');
const pastPhoto = document.querySelector('.photo-slide');
const pastPhotoDots = document.querySelector('.photo-dots');
const pastPhotoCard = document.querySelector('.photo-card');


const pastPhotoSources = [
  'assets/images/p1.jpeg',
  'assets/images/p2.jpeg',
  'assets/images/p3.jpeg',
  'assets/images/p4.jpeg',
  'assets/images/p5.jpeg',
  'assets/images/p6.jpeg',
  'assets/images/p7.jpeg',
  'assets/images/p8.jpeg',
  'assets/images/p9.jpeg',
  'assets/images/p10.jpeg',
  'assets/images/p11.jpeg',
  'assets/images/p12.jpeg',
  'assets/images/p13.jpeg',
  'assets/images/p14.jpeg',
  'assets/images/p15.jpeg',
  'assets/images/p16.jpeg',
];

let pastVideoIndex = 0;
let pastPhotoIndex = 0;
let pastVideoTimer = null;
let pastPhotoTimer = null;
let pastVideoPaused = false;

function createDots(container, total, onSelect) {
  if (!container) return [];
  container.innerHTML = '';
  return Array.from({ length: total }, (_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'last-year-dot';
    dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
    dot.addEventListener('click', () => onSelect(index));
    container.appendChild(dot);
    return dot;
  });
}

function setActiveDot(dots, index) {
  if (!dots) return;
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
    dot.setAttribute('aria-pressed', i === index ? 'true' : 'false');
  });
}

function fadeMedia(el, callback) {
  if (!el || prefersReducedMotion) {
    callback();
    return;
  }
  el.classList.add('last-year-fade');
  window.setTimeout(() => {
    callback();
    el.classList.remove('last-year-fade');
  }, 250);
}

const pastVideoDotsList = createDots(pastVideoDots, pastVideos.length, (index) => {
  pastVideoIndex = index;
  updatePastVideo();
  resetPastVideoTimer();
});

const pastPhotoDotsList = createDots(pastPhotoDots, pastPhotoSources.length, (index) => {
  pastPhotoIndex = index;
  updatePastPhoto();
  resetPastPhotoTimer();
});

function updatePastVideo() {
  if (!pastVideos.length) return;
  pastVideos.forEach((video, index) => {
    const isActive = index === pastVideoIndex;
    video.classList.toggle('active', isActive);
    video.muted = true;
    if (isActive) {
      video.currentTime = 0;
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  });
  setActiveDot(pastVideoDotsList, pastVideoIndex);
  if (pastVideoToggle) {
    pastVideoToggle.textContent = 'Tap for sound';
    pastVideoToggle.setAttribute('aria-pressed', 'false');
  }
}

function updatePastPhoto() {
  if (!pastPhoto) return;
  fadeMedia(pastPhoto, () => {
    pastPhoto.src = pastPhotoSources[pastPhotoIndex];
    pastPhoto.alt = `PlayTopia moment ${pastPhotoIndex + 1}`;
  });
  setActiveDot(pastPhotoDotsList, pastPhotoIndex);
}

function nextPastVideo() {
  pastVideoIndex = (pastVideoIndex + 1) % pastVideos.length;
  updatePastVideo();
}

function nextPastPhoto() {
  pastPhotoIndex = (pastPhotoIndex + 1) % pastPhotoSources.length;
  updatePastPhoto();
}

function resetPastVideoTimer() {
  if (prefersReducedMotion) return;
  if (pastVideoTimer) window.clearInterval(pastVideoTimer);
  if (pastVideoPaused) return;
  pastVideoTimer = window.setInterval(nextPastVideo, 7000);
}

function resetPastPhotoTimer() {
  if (prefersReducedMotion) return;
  if (pastPhotoTimer) window.clearInterval(pastPhotoTimer);
  pastPhotoTimer = window.setInterval(nextPastPhoto, 3000);
}

if (pastVideos.length) {
  updatePastVideo();
  resetPastVideoTimer();
  pastVideos.forEach((video) => {
    video.addEventListener('click', () => {
      if (!video.classList.contains('active')) return;
      pastVideoPaused = !pastVideoPaused;
      if (pastVideoPaused) {
        if (pastVideoTimer) window.clearInterval(pastVideoTimer);
        video.muted = false;
        video.play().catch(() => undefined);
        if (pastVideoToggle) {
          pastVideoToggle.textContent = 'Tap to mute';
          pastVideoToggle.setAttribute('aria-pressed', 'true');
        }
        return;
      }
      video.muted = true;
      if (pastVideoToggle) {
        pastVideoToggle.textContent = 'Tap for sound';
        pastVideoToggle.setAttribute('aria-pressed', 'false');
      }
      resetPastVideoTimer();
    });
  });

  pastVideos.forEach((video) => {
    video.play().then(() => video.pause()).catch(() => undefined);
  });
}

if (pastVideoToggle && pastVideos.length) {
  pastVideoToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const activeVideo = pastVideos[pastVideoIndex];
    if (activeVideo) activeVideo.click();
  });
}

if (pastPhoto) {
  updatePastPhoto();
  resetPastPhotoTimer();
}

if (pastPhotoCard && !prefersReducedMotion) {
  pastPhotoCard.addEventListener('mouseenter', () => {
    if (pastPhotoTimer) window.clearInterval(pastPhotoTimer);
  });
  pastPhotoCard.addEventListener('mouseleave', () => {
    resetPastPhotoTimer();
  });
}
