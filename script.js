/* ============================================================
   12th ANNIVERSARY SURPRISE v2 — Interactive Edition
   script.js

   Structure:
   1.  GSAP plugin registration
   2.  Sound engine  (Web Audio API — no audio files needed)
   3.  Utility: burst / trail / floating layer
   4.  Discovery tracker
   5.  Preloader
   6.  Entry gate portal
   7.  Custom cursor + heart trail
   8.  Scroll progress
   9.  Hero canvas + entrance timeline
   10. Story letters (flip cards)
   11. Memory corkboard (drag + flip)
   12. Heart hunt
   13. Reasons card deck
   14. Special message + hold-to-feel heartbeat
   15. Gift box reveal
   16. Final section
   17. Scroll-triggered section animations
   18. Music toggle
   19. Editable name
   20. Share button
   21. Easter egg
   22. DOMContentLoaded init
   ============================================================ */

gsap.registerPlugin(ScrollTrigger, TextPlugin);

// Prevent browser from saving scroll position on refresh
if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
}
window.onbeforeunload = () => {
  window.scrollTo(0, 0);
};
window.scrollTo(0, 0);


/* ════════════════════════════════════════════════════════════
   1. SOUND ENGINE  (Web Audio API)
   ════════════════════════════════════════════════════════════ */
let _actx;
const getCtx = () => {
  if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
  return _actx;
};
// Resume suspended context on user interaction
document.addEventListener('pointerdown', () => {
  if (_actx?.state === 'suspended') _actx.resume();
}, { passive: true });

function tone(freq, type = 'sine', vol = 0.08, dur = 0.1) {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur + 0.02);
  } catch (_) { }
}
function chord(freqs, vol = 0.06, dur = 0.2, step = 60) {
  freqs.forEach((f, i) => setTimeout(() => tone(f, 'sine', vol, dur), i * step));
}

const SFX = {
  click: () => tone(480, 'sine', 0.07, 0.06),
  pop: () => { tone(750, 'sine', 0.1, 0.05); setTimeout(() => tone(350, 'sine', 0.07, 0.08), 25); },
  flip: () => chord([480, 640], 0.05, 0.18, 90),
  collect: () => chord([380, 500, 660, 820], 0.06, 0.12, 70),
  sparkle: () => chord([800, 1000, 1300, 1600], 0.04, 0.25, 55),
  unlock: () => chord([300, 400, 500, 650, 820, 1050], 0.06, 0.4, 65),
  letter: () => chord([360, 480], 0.05, 0.28, 110),
  heart: () => tone(520, 'triangle', 0.10, 0.20),
  gift: () => chord([350, 440, 560, 700, 880], 0.07, 0.35, 85),
  drop: () => tone(200, 'sine', 0.06, 0.12),
};


/* ════════════════════════════════════════════════════════════
   2. UTILITY — burst, trail, floating layer
   ════════════════════════════════════════════════════════════ */
const BURST_SYMS = ['❤️', '💕', '💖', '✨', '💫'];
const TRAIL_SYMS = ['❤️', '💕', '✨', '💫', '🌸'];

function spawnBurst(x, y, syms = BURST_SYMS, count = 8) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'burst-p';
    el.textContent = syms[i % syms.length];
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);

    const angle = (i / count) * 360 + Math.random() * 20;
    const dist = Math.random() * 70 + 35;
    const rad = angle * Math.PI / 180;

    gsap.fromTo(el,
      { opacity: 1, scale: 0.2, x: 0, y: 0 },
      {
        opacity: 0,
        scale: Math.random() * 0.8 + 0.4,
        x: Math.cos(rad) * dist,
        y: Math.sin(rad) * dist,
        duration: 0.65 + Math.random() * 0.4,
        ease: 'power2.out',
        onComplete: () => el.remove(),
      }
    );
  }
}

let _trailThrottle = 0;
function spawnTrail(x, y) {
  const now = Date.now();
  if (now - _trailThrottle < 65) return;
  _trailThrottle = now;

  const el = document.createElement('div');
  el.className = 'trail-p';
  el.textContent = TRAIL_SYMS[Math.floor(Math.random() * TRAIL_SYMS.length)];
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);

  gsap.fromTo(el,
    { opacity: 0.85, scale: 0.4, x: 0, y: 0 },
    {
      opacity: 0, scale: 0.7,
      x: (Math.random() - 0.5) * 36,
      y: -(Math.random() * 45 + 15),
      duration: 0.75, ease: 'power2.out',
      onComplete: () => el.remove(),
    }
  );
}

function initFloatingLayer() {
  const layer = document.getElementById('floating-layer');
  const symbols = ['❤️', '✨', '💫', '🌸', '💕', '⭐', '💖', '🌟'];
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('div');
    el.className = 'float-p';
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.cssText = [
      `left:${Math.random() * 100}%`,
      `bottom:-6%`,
      `font-size:${(Math.random() * .9 + .7).toFixed(2)}rem`,
      `--d:${(Math.random() * 9 + 7).toFixed(1)}s`,
      `--dl:${(Math.random() * 12).toFixed(1)}s`,
      `--dx:${((Math.random() - .5) * 120).toFixed(0)}px`,
    ].join(';');
    layer.appendChild(el);
  }
}

function fireConfetti(side) {
  const colors = ['#ff6b9d', '#9b59b6', '#ffd700', '#ff9bb8', '#c06dd4', '#fff', '#7c3aed'];
  if (!side) {
    confetti({ particleCount: 130, spread: 90, origin: { x: .5, y: .55 }, colors, startVelocity: 38, gravity: .85, ticks: 220 });
    return;
  }
  if (side === 'l') confetti({ particleCount: 65, angle: 65, spread: 60, origin: { x: .05, y: .75 }, colors });
  if (side === 'r') confetti({ particleCount: 65, angle: 115, spread: 60, origin: { x: .95, y: .75 }, colors });
}


/* ════════════════════════════════════════════════════════════
   3. DISCOVERY TRACKER
   ════════════════════════════════════════════════════════════ */
const _unlocked = new Set();

function unlock(n) {
  if (_unlocked.has(n)) return;
  _unlocked.add(n);
  const dot = document.querySelector(`.tdot[data-i="${n}"]`);
  if (!dot) return;
  dot.classList.add('lit');
  gsap.fromTo(dot, { scale: 2.5 }, { scale: 1.35, duration: .5, ease: 'elastic.out(2,.5)' });
}

const unlockState = {
  storyDone: false,
  memoriesDone: false,
  huntDone: false,
  reasonsDone: false,
  specialDone: false,
  giftDone: false,
};

let toastTimeout;
function showMadToast(msg) {
  let el = document.getElementById('mad-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'mad-toast';
    el.className = 'mad-toast';
    document.body.appendChild(el);
  }
  el.innerHTML = msg;
  el.classList.add('show');
  if (typeof SFX !== 'undefined' && SFX.drop) SFX.drop();
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    el.classList.remove('show');
  }, 3500);
}

function initScrollLocks() {
  const sections = [
    { id: 'story',    check: () => unlockState.storyDone,    msg: "Hey idiot! Read the letters first! I didn't spend hours writing them for you to ignore! 😠💕" },
    { id: 'memories', check: () => unlockState.memoriesDone, msg: "Hello? Unveil all 6 photos before scrolling! I worked hard on those! 🙄" },
    { id: 'hunt',     check: () => unlockState.huntDone,     msg: "You're not leaving until you find all 5 hidden hearts! Keep looking! 😤" },
    { id: 'reasons',  check: () => unlockState.reasonsDone,  msg: "Tap the deck and see all the reasons I love you! Stop rushing! 🥊" },
    { id: 'special',  check: () => unlockState.specialDone,  msg: "Hold the heart to feel my heartbeat first... impatient much?! ❤️🥺" },
    { id: 'gift',     check: () => unlockState.giftDone,     msg: "Are you seriously scrolling past your gift? Open the damn box! 🎁😡" },
  ];

  sections.forEach(sec => {
    ScrollTrigger.create({
      trigger: `#${sec.id}`,
      start: 'bottom 85%',
      onEnter: () => {
        if (!sec.check()) {
          const el = document.getElementById(sec.id);
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          showMadToast(sec.msg);
        }
      }
    });
  });
}

/* ════════════════════════════════════════════════════════════
   4. PRELOADER
   ════════════════════════════════════════════════════════════ */
// No preloader in this version — entry gate serves that role.
// Body starts visible; entry gate is the gate.


/* ════════════════════════════════════════════════════════════
   5. ENTRY GATE
   ════════════════════════════════════════════════════════════ */
function initEntryGate() {
  const gate = document.getElementById('entry-gate');
  const portal = document.getElementById('entry-portal');
  const exp = document.getElementById('experience');
  const ptcEl = document.getElementById('entry-particles');

  // Disable scroll until the gate is opened
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  window.scrollTo(0, 0);
  setTimeout(() => window.scrollTo(0, 0), 30);
  setTimeout(() => window.scrollTo(0, 0), 100);

  // Spawn ambient particles
  const syms = ['✨', '💫', '⭐', '🌸', '💖', '❤️', '🌟', '💕'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'entry-particle';
    p.textContent = syms[Math.floor(Math.random() * syms.length)];
    p.style.cssText = [
      `left:${Math.random() * 100}%`,
      `top:${Math.random() * 100}%`,
      `font-size:${(Math.random() * .8 + .5).toFixed(1)}rem`,
      `--d:${(Math.random() * 4 + 3).toFixed(1)}s`,
      `--dl:${(Math.random() * 4).toFixed(1)}s`,
      `--dx:${((Math.random() - .5) * 90).toFixed(0)}px`,
      `--dy:${((Math.random() - .5) * 60).toFixed(0)}px`,
    ].join(';');
    ptcEl.appendChild(p);
  }

  let opened = false;
  const openGate = () => {
    if (opened) return;
    opened = true;
    SFX.sparkle();

    // Explode the portal outward
    const tl = gsap.timeline();
    tl.to(portal, { scale: 1.25, duration: .2, ease: 'power2.out' })
      .to('.portal-ring', { scale: 4, opacity: 0, stagger: .1, duration: .7, ease: 'power3.out' }, '-=.1')
      .to('.portal-core', { scale: 0, opacity: 0, duration: .4, ease: 'back.in(2)' }, '-=.5')
      .to(gate, { opacity: 0, duration: .55, ease: 'power2.inOut' }, '-=.2')
      .add(() => {
        gate.classList.add('dismissed');
        exp.classList.add('unlocked');
        document.body.style.overflow = ''; // Re-enable scroll
        document.documentElement.style.overflow = '';
        unlock(0);
        setTimeout(() => {
          ScrollTrigger.refresh();
          SFX.unlock && SFX.unlock();
          playHeroTimeline();
        }, 50);
      });

    // Burst of hearts from click point
    spawnBurst(window.innerWidth / 2, window.innerHeight / 2,
      ['❤️', '✨', '💫', '🌟', '💖', '🎉'], 16);
  };

  portal.addEventListener('click', openGate);
  portal.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGate(); }
  });
}


/* ════════════════════════════════════════════════════════════
   6. CUSTOM CURSOR + HEART TRAIL
   ════════════════════════════════════════════════════════════ */
function initCursor() {
  if (!window.matchMedia('(pointer:fine)').matches) return;

  const dot = document.getElementById('cursor-dot');
  const outer = document.getElementById('cursor-outer');
  gsap.set([dot, outer], { x: -100, y: -100 });

  const dotX = gsap.quickTo(dot, 'x', { duration: .08, ease: 'none' });
  const dotY = gsap.quickTo(dot, 'y', { duration: .08, ease: 'none' });
  const outerX = gsap.quickTo(outer, 'x', { duration: .28, ease: 'power2.out' });
  const outerY = gsap.quickTo(outer, 'y', { duration: .28, ease: 'power2.out' });

  document.addEventListener('mousemove', e => {
    dotX(e.clientX - 5); dotY(e.clientY - 5);
    outerX(e.clientX - 18); outerY(e.clientY - 18);
    spawnTrail(e.clientX, e.clientY);
  });

  const wireHover = () =>
    document.querySelectorAll('a,button,[role=button],.memo-card,.flip-card,.hunt-heart,.hold-btn,.deck-stack')
      .forEach(el => {
        el.addEventListener('mouseenter', () => { dot.classList.add('hov'); outer.classList.add('hov'); });
        el.addEventListener('mouseleave', () => { dot.classList.remove('hov'); outer.classList.remove('hov'); });
      });
  wireHover();

  // Click anywhere → burst
  document.addEventListener('click', e => {
    if (e.target.closest('button,a,input,[contenteditable="true"],.gift-box')) return;
    spawnBurst(e.clientX, e.clientY, BURST_SYMS, 7);
  });

  document.addEventListener('mouseleave', () => gsap.to([dot, outer], { opacity: 0, duration: .2 }));
  document.addEventListener('mouseenter', () => gsap.to([dot, outer], { opacity: 1, duration: .2 }));
}


/* ════════════════════════════════════════════════════════════
   7. SCROLL PROGRESS
   ════════════════════════════════════════════════════════════ */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    bar.style.width = (pct * 100) + '%';
  }, { passive: true });
}


/* ════════════════════════════════════════════════════════════
   8. HERO CANVAS (particle field)
   ════════════════════════════════════════════════════════════ */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const COLORS = ['#ff6b9d', '#9b59b6', '#ffd700', '#c06dd4', '#ffffff'];

  const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const N = window.innerWidth < 600 ? 50 : 88;
  const mkP = () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.8 + 0.4,
    vx: (Math.random() - .5) * .25,
    vy: -(Math.random() * .45 + .1),
    a: Math.random() * .55 + .15,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  });
  const pts = Array.from({ length: N }, mkP);

  let raf;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.a;
      ctx.fill();
      p.x += p.vx; p.y += p.vy; p.a -= .0012;
      if (p.y < -10 || p.a <= 0) Object.assign(p, mkP(), { y: canvas.height + 10, a: Math.random() * .55 + .15 });
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  };
  draw();

  ScrollTrigger.create({
    trigger: '#hero', start: 'top top', end: 'bottom top',
    onLeave: () => cancelAnimationFrame(raf),
    onEnterBack: draw,
  });
}

/* Hero entrance timeline — runs after entry gate dismisses */
function playHeroTimeline() {
  gsap.set(['#hero-pre', '#hero-title', '#hero-sub', '#hero-cta', '#hero-star'], { opacity: 0, y: 40 });
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to('#hero-pre', { opacity: 1, y: 0, duration: .9 })
    .to('#hero-title', { opacity: 1, y: 0, duration: 1.1, ease: 'back.out(1.5)' }, '-=.4')
    .to('#hero-sub', { opacity: 1, y: 0, duration: .85 }, '-=.5')
    .to('#hero-cta', { opacity: 1, y: 0, duration: .7 }, '-=.3')
    .to('#hero-star', { opacity: .35, y: 0, duration: .5 }, '-=.3');

  // Parallax on mouse move (desktop only)
  if (window.matchMedia('(pointer:fine)').matches) {
    const heroEl = document.getElementById('hero');
    const content = heroEl.querySelector('.hero-content');
    heroEl.addEventListener('mousemove', e => {
      const nx = (e.clientX / window.innerWidth - .5) * 2;
      const ny = (e.clientY / window.innerHeight - .5) * 2;
      gsap.to(content, { x: nx * -14, y: ny * -9, duration: .9, ease: 'power1.out' });
    });
    heroEl.addEventListener('mouseleave', () =>
      gsap.to(content, { x: 0, y: 0, duration: 1, ease: 'power2.out' }));
  }
}


/* ════════════════════════════════════════════════════════════
   9. STORY LETTERS (flip cards)
   ════════════════════════════════════════════════════════════ */
function initStoryLetters() {
  const countEl = document.getElementById('letters-opened');
  let opened = 0;

  document.querySelectorAll('.flip-card').forEach(card => {
    const doFlip = () => {
      if (card.dataset.open === 'true') return; // already open
      card.dataset.open = 'true';
      card.classList.add('open');
      SFX.letter();

      // Seal pop burst
      const rect = card.getBoundingClientRect();
      spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2,
        ['💌', '✨', '💕', '❤️'], 8);

      opened++;
      countEl.textContent = opened;

      // Jiggle card
      gsap.fromTo(card,
        { rotation: -4 },
        { rotation: 0, duration: .5, ease: 'elastic.out(2, .5)' }
      );

      if (opened >= 4) {
        unlockState.storyDone = true;
        unlock(1); // story discovery
        SFX.sparkle();
      }
    };

    card.addEventListener('click', doFlip);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doFlip(); }
    });
  });
}


/* ════════════════════════════════════════════════════════════
   10. MEMORY CORKBOARD — drag + double-tap to flip
   ════════════════════════════════════════════════════════════ */
function initMemoCards() {
  let zTop = 10;

  document.querySelectorAll('.memo-card').forEach(card => {
    // Position from data attributes (% of corkboard)
    card.style.left = (parseFloat(card.dataset.cx) || 5) + '%';
    card.style.top = (parseFloat(card.dataset.cy) || 5) + '%';
    const baseRot = parseFloat(card.dataset.cr) || 0;
    gsap.set(card, { rotation: baseRot });

    let dragging = false;
    let startX, startY;
    let tx = 0, ty = 0;
    let moved = false;
    let lastTap = 0;

    card.addEventListener('pointerdown', e => {
      dragging = true;
      moved = false;
      startX = e.clientX - tx;
      startY = e.clientY - ty;
      card.setPointerCapture(e.pointerId);
      card.style.zIndex = ++zTop;
      gsap.to(card, { scale: 1.06, duration: .12 });
      SFX.click();
    });

    card.addEventListener('pointermove', e => {
      if (!dragging) return;
      const nx = e.clientX - startX;
      const ny = e.clientY - startY;
      if (Math.abs(nx - tx) > 4 || Math.abs(ny - ty) > 4) moved = true;
      tx = nx; ty = ny;
      gsap.set(card, { x: tx, y: ty });
    });

    card.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      gsap.to(card, { scale: 1, rotation: baseRot, duration: .55, ease: 'elastic.out(1,.45)' });
      SFX.drop();

      if (!moved) {
        const now = Date.now();
        if (now - lastTap < 380) {
          // Double-tap
          const imgSrc = card.querySelector('.memo-front img').src;
          const captionHTML = card.querySelector('.memo-back p').innerHTML;
          if (!card.classList.contains('revealed')) {
            card.classList.add('revealed');
            const revealedCount = document.querySelectorAll('.memo-card.revealed').length;
            if (revealedCount >= 6) {
              unlockState.memoriesDone = true;
              unlock(2); // memories discovered
            }
          }
          if (window.openLightbox) {
            window.openLightbox(imgSrc, captionHTML);
          } else {
            card.classList.toggle('flipped');
            SFX.flip();
          }
          gsap.fromTo(card, { scale: 1 }, { scale: 1.1, duration: .15, yoyo: true, repeat: 1 });
        }
        lastTap = now;
      }
    });

    card.addEventListener('pointercancel', () => {
      dragging = false;
      gsap.to(card, { scale: 1, rotation: baseRot, duration: .4, ease: 'back.out(1.5)' });
    });
  });

  // Fade out the board-note after first interaction
  const note = document.getElementById('board-note');
  document.getElementById('corkboard').addEventListener('pointerdown', () => {
    if (note) {
      gsap.to(note, { opacity: 0, duration: .5, delay: 2, onComplete: () => note.remove() });
    }
  }, { once: true });
}


/* ════════════════════════════════════════════════════════════
   11. HEART HUNT
   ════════════════════════════════════════════════════════════ */
function initHeartHunt() {
  const countEl = document.getElementById('hunt-found');
  const reward = document.getElementById('hunt-reward');
  const TOTAL = 5;
  let found = 0;

  // Ripple zones reveal hidden hearts on hover / focus
  document.querySelectorAll('.ripple-zone').forEach(zone => {
    const target = document.getElementById(zone.dataset.reveals);
    if (!target) return;

    const reveal = () => {
      target.classList.remove('is-hidden');
      target.classList.add('revealed');
      zone.classList.add('done');
      SFX.sparkle();
    };
    zone.addEventListener('mouseenter', reveal, { once: true });
    zone.addEventListener('focus', reveal, { once: true });
    zone.addEventListener('click', reveal, { once: true });
  });

  // Click a heart to collect it
  document.querySelectorAll('.hunt-heart').forEach(heart => {
    heart.addEventListener('click', () => {
      if (heart.classList.contains('collected')) return;
      heart.classList.add('collected');
      SFX.collect();
      found++;
      countEl.textContent = found;

      // Scale counter pop
      gsap.fromTo(countEl,
        { scale: 1.8, color: '#ffd700' },
        { scale: 1, color: '#ff6b9d', duration: .45, ease: 'back.out(2)' }
      );

      // Burst from heart position
      const r = heart.getBoundingClientRect();
      spawnBurst(r.left + r.width / 2, r.top + r.height / 2, ['❤️', '💕', '💖'], 10);

      if (found >= TOTAL) {
        setTimeout(showHuntReward, 600);
      }
    });
  });

  function showHuntReward() {
    unlockState.huntDone = true;
    reward.removeAttribute('hidden');
    reward.classList.add('visible');
    unlock(3); // hearts discovery
    SFX.unlock();
    fireConfetti(); setTimeout(() => fireConfetti('l'), 300); setTimeout(() => fireConfetti('r'), 500);
    gsap.fromTo(reward,
      { scale: .85, opacity: 0 },
      { scale: 1, opacity: 1, duration: .8, ease: 'back.out(1.4)' }
    );
  }
}


/* ════════════════════════════════════════════════════════════
   12. REASONS CARD DECK
   ════════════════════════════════════════════════════════════ */
const REASONS = [
  { icon: '😊', title: 'Your smile is my favourite thing', body: 'It lights up every room you walk into — and every corner of my heart.' },
  { icon: '💪', title: 'Your strength inspires me daily', body: 'The way you handle life with grace and courage is something I deeply admire.' },
  { icon: '🧠', title: 'Your mind is endlessly fascinating', body: 'The way you think, the way you see the world — I could listen to you forever.' },
  { icon: '🤝', title: 'You show up — always', body: 'You are the most reliable, loyal person I know. That means everything.' },
  { icon: '🌱', title: 'You make me want to grow', body: 'Loving you has made me a better version of myself, and I\'m endlessly grateful.' },
  { icon: '🌊', title: 'Your kindness has no limits', body: 'The warmth you give to everyone around you is one of your most beautiful gifts.' },
];

function initCardDeck() {
  const stack = document.getElementById('deck-stack');
  const deckTop = document.getElementById('deck-top');
  const revealed = document.getElementById('deck-revealed');
  const curEl = document.getElementById('deck-cur');
  const maxEl = document.getElementById('deck-max');
  let cur = 0;

  maxEl.textContent = REASONS.length;

  const revealNext = () => {
    if (cur >= REASONS.length) return;
    const r = REASONS[cur];
    const dir = cur % 2 === 0 ? 1 : -1;
    SFX.flip();

    // Fly top card off in alternating direction
    gsap.to(deckTop, {
      x: dir * window.innerWidth * .4,
      y: -90, rotation: dir * 28, opacity: 0,
      duration: .5, ease: 'power2.in',
      onComplete: () => gsap.set(deckTop, { x: 0, y: 0, rotation: 0, opacity: 1 }),
    });

    // Build revealed card
    const card = document.createElement('div');
    card.className = 'reason-card';
    card.innerHTML = `
      <div class="reason-card__icon">${r.icon}</div>
      <h3 class="reason-card__title">${r.title}</h3>
      <p  class="reason-card__body">${r.body}</p>
    `;
    revealed.appendChild(card);

    gsap.fromTo(card,
      { opacity: 0, scale: .72, rotation: dir * 10, y: 50 },
      {
        opacity: 1, scale: 1, rotation: dir * -2, y: 0,
        duration: .65, ease: 'back.out(1.6)'
      }
    );

    cur++;
    curEl.textContent = cur;

    // Fade stack bg cards as deck empties
    if (cur >= REASONS.length - 1) gsap.to('.dc-3', { opacity: 0, duration: .3 });
    if (cur >= REASONS.length) gsap.to(['.dc-2', '.dc-1'], { opacity: 0, duration: .3 });

    if (cur >= REASONS.length) {
      document.getElementById('deck-tap-hint').innerHTML = '🎉 All revealed!';
      stack.style.cursor = 'default';
      unlockState.reasonsDone = true;
      SFX.sparkle();
    }
  };

  stack.addEventListener('click', revealNext);
  stack.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); revealNext(); } });
}


/* ════════════════════════════════════════════════════════════
   13. SPECIAL MESSAGE + HOLD HEARTBEAT
   ════════════════════════════════════════════════════════════ */
const SPECIAL_MESSAGE =
  '"You are the most precious person in my world. From the moment you walked into my life, everything became more colourful, more warm, more alive. I am so incredibly lucky to love you — and I will spend every day making sure you know it."';

function initSpecialSection() {
  // ScrollTrigger: spotlight + typewriter
  gsap.set('.special-wrap', { opacity: 0, y: 50 });
  gsap.set('#spotlight', { opacity: 0 });

  ScrollTrigger.create({
    trigger: '#special', start: 'top 60%', once: true,
    onEnter: () => {
      gsap.to('#spotlight', { opacity: 1, duration: 1.5, ease: 'power2.out' });
      gsap.to('.special-wrap', {
        opacity: 1, y: 0, duration: .9, ease: 'power3.out', delay: .3,
        onComplete: () => typewriter(
          document.getElementById('typewriter-el'), SPECIAL_MESSAGE, 38
        ),
      });
    },
  });

  initHoldButton();
}

function typewriter(el, text, speed) {
  el.innerHTML = '';
  const cursor = document.createElement('span');
  cursor.className = 'typewriter-cursor';
  el.appendChild(cursor);
  let i = 0;
  const tick = () => {
    if (i < text.length) {
      el.insertBefore(document.createTextNode(text[i++]), cursor);
      setTimeout(tick, speed + Math.random() * 16 - 8);
    } else {
      setTimeout(() => gsap.to(cursor, { opacity: 0, duration: .5, onComplete: () => cursor.remove() }), 1800);
    }
  };
  tick();
}

function initHoldButton() {
  const btn = document.getElementById('hold-btn');
  const fill = document.getElementById('hold-ring-fill');
  const CIRC = 138.2;  // 2π × 22
  const HOLD_MS = 2600;
  let raf, holdStart, done = false;

  const start = () => {
    if (done) return;
    holdStart = Date.now();
    btn.classList.add('holding');
    document.body.classList.add('is-heartbeating');
    SFX.heart();
    const tick = () => {
      const p = Math.min((Date.now() - holdStart) / HOLD_MS, 1);
      fill.style.strokeDashoffset = CIRC * (1 - p);
      // Pulse screen subtly
      if (p < 1) { raf = requestAnimationFrame(tick); }
      else { completeHold(); }
    };
    raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (done) return;
    cancelAnimationFrame(raf);
    btn.classList.remove('holding');
    document.body.classList.remove('is-heartbeating');
    fill.style.strokeDashoffset = CIRC;
  };

  const completeHold = () => {
    done = true;
    unlockState.specialDone = true;
    cancelAnimationFrame(raf);
    btn.classList.remove('holding');
    btn.classList.add('complete');
    document.body.classList.remove('is-heartbeating');
    SFX.sparkle();

    // Screen flash
    gsap.fromTo(document.getElementById('special'),
      { backgroundColor: 'rgba(255,107,157,.12)' },
      { backgroundColor: 'transparent', duration: 1.2, ease: 'power2.out' }
    );

    // Reward message
    const msg = document.createElement('div');
    msg.className = 'hold-reward';
    msg.textContent = '💕 You felt it — that\'s my heartbeat for you.';
    btn.parentElement.insertBefore(msg, btn);
    gsap.fromTo(msg, { opacity: 0, y: 10 }, { opacity: 1, y: -8, duration: .6, ease: 'back.out(1.5)' });

    const r = btn.getBoundingClientRect();
    spawnBurst(r.left + r.width / 2, r.top, ['❤️', '💕', '💖'], 12);
    fireConfetti();
  };

  btn.addEventListener('pointerdown', e => { e.preventDefault(); start(); });
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointerleave', stop);
  btn.addEventListener('pointercancel', stop);
}


/* ════════════════════════════════════════════════════════════
   14. GIFT BOX
   ════════════════════════════════════════════════════════════ */
function initGiftBox() {
  // gift-intro animates via generic [data-sa="fade-up"] handler
  gsap.from('#gift-scene', {
    scrollTrigger: { trigger: '#gift', start: 'top 72%', toggleActions: 'play none none none' },
    opacity: 0, y: 80, scale: .8, duration: 1, ease: 'back.out(1.4)', delay: .2,
  });

  const box = document.getElementById('gift-box');
  const reveal = document.getElementById('gift-reveal');
  let opened = false;

  const openBox = () => {
    if (opened) return;
    opened = true;
    box.classList.add('open');
    SFX.gift();
    gsap.to('#gift-scene', { scale: 1.07, duration: .15, yoyo: true, repeat: 1 });

    setTimeout(fireConfetti, 380);
    setTimeout(() => fireConfetti('l'), 550);
    setTimeout(() => fireConfetti('r'), 720);

    setTimeout(() => {
      reveal.classList.add('open');
      gsap.fromTo(reveal,
        { opacity: 0, y: 40, scale: .87 },
        { opacity: 1, y: 0, scale: 1, duration: .9, ease: 'back.out(1.5)' }
      );
      unlockState.giftDone = true;
      unlock(4);

      // Auto-scroll to the text so the user sees it without manually scrolling
      setTimeout(() => reveal.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
    }, 780);
  };

  box.addEventListener('click', openBox);
  box.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBox(); } });
}


/* ════════════════════════════════════════════════════════════
   15. FINAL SECTION
   ════════════════════════════════════════════════════════════ */
function initFinalSection() {
  // Spawn looping particles inside the final section
  const ptc = document.getElementById('final-ptc');
  const symbols = ['❤️', '💖', '✨', '💕', '🌸', '💫', '🌟'];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    el.className = 'float-p';
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.cssText = [
      `left:${Math.random() * 100}%`,
      `bottom:-6%`,
      `font-size:${(Math.random() * 1.4 + .9).toFixed(2)}rem`,
      `--d:${(Math.random() * 7 + 5).toFixed(1)}s`,
      `--dl:${(Math.random() * 5).toFixed(1)}s`,
      `--dx:${((Math.random() - .5) * 90).toFixed(0)}px`,
    ].join(';');
    ptc.appendChild(el);
  }

  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#final', start: 'top 70%', toggleActions: 'play none none none' },
    defaults: { ease: 'power3.out' },
  });
  tl.from('[data-sa="final-in"]', { opacity: 0, y: 50, duration: .85, stagger: .18 });
}


/* ════════════════════════════════════════════════════════════
   16. SCROLL-TRIGGERED SECTION ANIMATIONS
   ════════════════════════════════════════════════════════════ */
function initScrollAnimations() {
  initScrollLocks();
  
  // Generic fade-up triggers
  gsap.utils.toArray('[data-sa="fade-up"]').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none none' },
      opacity: 0, y: 50, duration: 1, ease: 'power3.out',
    });
  });

  // Story letters stagger in
  gsap.from('.letter-wrap', {
    scrollTrigger: { trigger: '#letters-grid', start: 'top 80%', toggleActions: 'play none none none' },
    opacity: 0, y: 70, scale: .88,
    duration: .8, ease: 'back.out(1.4)', stagger: .12,
  });

  // (hunt header handled by generic fade-up)

  // (reasons header handled by generic fade-up above)
}


/* ════════════════════════════════════════════════════════════
   17. MUSIC TOGGLE
   ════════════════════════════════════════════════════════════ */
function initMusic() {
  const btn = document.getElementById('music-toggle');
  const aud = document.getElementById('bg-music');
  const on = btn.querySelector('.music-on');
  const off = btn.querySelector('.music-off');
  let play = false;

  btn.addEventListener('click', () => {
    if (play) {
      aud.pause();
      on.hidden = false; off.hidden = true; play = false;
      gsap.fromTo(btn, { rotate: -15 }, { rotate: 0, duration: .3, ease: 'back.out(2)' });
    } else {
      aud.play().catch(() => { });
      on.hidden = true; off.hidden = false; play = true;
      gsap.fromTo(btn, { scale: .8 }, { scale: 1, duration: .4, ease: 'back.out(2)' });
    }
  });
}


/* ════════════════════════════════════════════════════════════
   18. EDITABLE NAME
   ════════════════════════════════════════════════════════════ */
function initEditableName() {
  const nameEl = document.getElementById('hero-name');
  const editBtn = document.getElementById('name-edit-btn');
  if (!nameEl || !editBtn) return;
  let editing = false;

  const start = () => {
    editing = true;
    nameEl.contentEditable = 'true';
    nameEl.focus();
    const rng = document.createRange();
    rng.selectNodeContents(nameEl);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(rng);
    editBtn.textContent = '✓';
    editBtn.style.background = 'rgba(255,215,0,.2)';
  };

  const finish = () => {
    editing = false;
    nameEl.textContent = nameEl.textContent.trim() || 'You';
    nameEl.contentEditable = 'false';
    editBtn.textContent = '✏️';
    editBtn.style.background = '';
    window.getSelection()?.removeAllRanges();
    gsap.fromTo(nameEl, { scale: .9 }, { scale: 1, duration: .5, ease: 'back.out(2.5)' });
    SFX.sparkle();
  };

  editBtn.addEventListener('click', () => editing ? finish() : start());
  nameEl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); finish(); } });
  nameEl.addEventListener('paste', e => {
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  });
}


/* ════════════════════════════════════════════════════════════
   19. SHARE BUTTON
   ════════════════════════════════════════════════════════════ */
function initShare() {
  const btn = document.getElementById('share-btn');
  const toast = document.getElementById('share-toast');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    gsap.fromTo(btn, { scale: 1 }, { scale: .93, duration: .1, yoyo: true, repeat: 1 });
    const shareData = { title: 'Happy 12th Anniversary! ❤️', url: window.location.href };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData); } catch (_) { }
      return;
    }
    try { await navigator.clipboard.writeText(window.location.href); }
    catch (_) {
      const ta = Object.assign(document.createElement('textarea'), { value: window.location.href });
      Object.assign(ta.style, { position: 'fixed', opacity: '0' });
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    toast.classList.add('show');
    const r = btn.getBoundingClientRect();
    spawnBurst(r.left + r.width / 2, r.top, ['💌', '❤️', '✨'], 6);
    setTimeout(() => toast.classList.remove('show'), 3000);
  });
}


/* ════════════════════════════════════════════════════════════
   20. EASTER EGG STAR
   ════════════════════════════════════════════════════════════ */
const EGG_MSGS = [
  '🌟 You found the star! Just like you — always shining.',
  '💫 Caught it! You are magic.',
  '⭐ Stars always reminded me of you.',
  '✨ Every wish I make is about you.',
];
let _eggCount = 0;
function initEasterEgg() {
  const star = document.getElementById('hero-star');
  if (!star) return;
  star.addEventListener('click', e => {
    e.stopPropagation();
    SFX.sparkle();
    spawnBurst(e.clientX, e.clientY, ['⭐', '🌟', '✨', '💫'], 12);

    const msg = document.createElement('div');
    msg.style.cssText = `
      position:fixed; left:50%; top:50%; transform:translate(-50%,-50%);
      background:rgba(10,0,25,.92); backdrop-filter:blur(16px);
      border:1px solid rgba(255,215,0,.3); border-radius:16px;
      padding:1.5rem 2.5rem; text-align:center;
      font-family:'Dancing Script',cursive; font-size:clamp(1.1rem,3vw,1.4rem);
      color:#ffd700; z-index:99999; pointer-events:none; max-width:90vw;
      box-shadow:0 0 60px rgba(255,215,0,.2);
    `;
    msg.textContent = EGG_MSGS[_eggCount % EGG_MSGS.length];
    _eggCount++;
    document.body.appendChild(msg);

    gsap.fromTo(msg,
      { scale: .7, opacity: 0 },
      {
        scale: 1, opacity: 1, duration: .4, ease: 'back.out(1.8)',
        onComplete: () => gsap.to(msg, { opacity: 0, y: -20, duration: .5, delay: 2, onComplete: () => msg.remove() }),
      }
    );

    // Animate the star itself
    gsap.fromTo(star, { rotation: 0 }, { rotation: 360, duration: .6, ease: 'power2.out' });
  });
}


/* ════════════════════════════════════════════════════════════
   22. LIGHTBOX
   ════════════════════════════════════════════════════════════ */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCaption = document.getElementById('lightbox-caption');
  const lbClose = document.getElementById('lightbox-close');
  if (!lightbox) return;

  const closeLb = () => {
    lightbox.classList.remove('open');
    if (typeof SFX !== 'undefined' && SFX.drop) SFX.drop();
  };

  lbClose.addEventListener('click', closeLb);
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLb();
  });

  window.openLightbox = (src, captionHtml) => {
    lbImg.src = src;
    lbCaption.innerHTML = captionHtml;
    lightbox.classList.add('open');
    if (typeof SFX !== 'undefined' && SFX.sparkle) SFX.sparkle();
  };
}


/* ════════════════════════════════════════════════════════════
   23. TOUCH — tap burst for mobile
   ════════════════════════════════════════════════════════════ */
function initTouchBurst() {
  document.addEventListener('touchend', e => {
    if (e.target.closest('button,a,input,.memo-card,.flip-card,.hunt-heart,.gift-box,.hold-btn,.deck-stack')) return;
    const t = e.changedTouches[0];
    spawnBurst(t.clientX, t.clientY, BURST_SYMS, 6);
  }, { passive: true });
}


/* ════════════════════════════════════════════════════════════
   INIT — DOMContentLoaded
   ════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initFloatingLayer();
  initScrollProgress();
  initCursor();
  initTouchBurst();
  initEntryGate();
  initHeroCanvas();
  initStoryLetters();
  initMemoCards();
  initHeartHunt();
  initCardDeck();
  initSpecialSection();
  initGiftBox();
  initFinalSection();
  initScrollAnimations();
  initMusic();
  initEditableName();
  initShare();
  initEasterEgg();
  initLightbox();
});
