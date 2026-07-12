// CodeOutfitters shared motion system — v2 (non-regression repair)
// Document-level engine. Survives React re-renders, hot reloads, and remounts:
// it never caches node lists across ticks and re-scans via MutationObserver.
//
// Hooks:
//   .fm-rv               — single-element scroll reveal with sibling stagger
//   [data-reveal]        — group reveal: children stagger in (100ms apart)
//   [data-count]         — count-up on first reveal (inside a [data-reveal])
//   .tl-node-v6          — gains .is-active (staggered) when its group reveals
//   .tl-progress-v6      — gains .is-filled when its group reveals
//   [data-scroll-progress] — width tracks page scroll %
//
// Reduced-motion users get everything fully visible and static.
// Normal-motion users get the full animation set.
(function () {
  'use strict';

  // Full motion is the default for everyone. The OS-level prefers-reduced-motion
  // media query is intentionally NOT used to kill animations — several client
  // environments have it force-enabled, which made every preview look static.
  // The explicit opt-in fallback is: <html data-motion="reduced"> or the
  // Homepage's motion="Reduced" prop (which sets .motion-reduced on the root).
  var reduced = document.documentElement.getAttribute('data-motion') === 'reduced';
  if (reduced) {
    var rmStyle = document.createElement('style');
    rmStyle.textContent =
      '*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;' +
      'transition-duration:.001ms!important;scroll-behavior:auto!important}';
    document.head.appendChild(rmStyle);
    return; // content stays fully visible, no reveal animation
  }

  var EASE = 'cubic-bezier(.16,1,.3,1)';
  var DIST = '22px';
  var DUR = 700;      // ms  (.fm-rv)
  var STAG = 70;      // ms per sibling (.fm-rv)
  var G_DIST = '28px';
  var G_DUR = 750;    // ms  ([data-reveal] children)
  var G_STAG = 100;   // ms per child
  var seen = (typeof WeakSet !== 'undefined') ? new WeakSet() : { has: function(){return false;}, add: function(){} };
  var primed = (typeof WeakSet !== 'undefined') ? new WeakSet() : { has: function(){return false;}, add: function(){} };

  /* ---------------- .fm-rv single-element reveal ---------------- */

  function siblingIndex(el) {
    var i = 0, p = el.parentElement;
    if (!p) return 0;
    var kids = p.children;
    for (var k = 0; k < kids.length; k++) {
      if (kids[k] === el) return Math.min(i, 8);
      if (kids[k].classList && kids[k].classList.contains('fm-rv')) i++;
    }
    return 0;
  }

  function revealFm(el) {
    var delay = siblingIndex(el) * STAG;
    el.style.transition = 'opacity ' + DUR + 'ms ' + EASE + ' ' + delay + 'ms, transform ' + DUR + 'ms ' + EASE + ' ' + delay + 'ms';
    void el.offsetWidth;
    el.style.opacity = '1';
    el.style.transform = 'none';
    setTimeout(function () {
      el.style.removeProperty('opacity');
      el.style.removeProperty('transform');
      el.style.removeProperty('transition');
      el.style.removeProperty('will-change');
    }, DUR + delay + 60);
  }

  function primeFm(el) {
    if (primed.has(el)) return;
    primed.add(el);
    var r = el.getBoundingClientRect();
    if (r.bottom < 0) return; // already scrolled past — leave visible
    el.style.opacity = '0';
    el.style.transform = 'translateY(' + DIST + ')';
    el.style.willChange = 'opacity, transform';
  }

  /* ---------------- [data-count] count-up ---------------- */

  var NUM = /^([↑↓]\s*)?([$£€]?)(\d[\d,]*)(K)?(\+)?(%)?$/;
  function countUp(el) {
    if (el._counted) return;
    el._counted = true;
    var raw = (el.textContent || '').trim();
    var m = raw.match(NUM);
    if (!m) return;
    var arrow = m[1] || '', cur = m[2] || '', digits = m[3], K = m[4] || '', plus = m[5] || '', pct = m[6] || '';
    var target = parseInt(digits.replace(/,/g, ''), 10);
    if (!isFinite(target) || target === 0) return;
    var comma = digits.indexOf(',') !== -1;
    var fmt = function (n) { return arrow + cur + (comma ? n.toLocaleString('en-US') : String(n)) + K + plus + pct; };
    var steps = 32, dur = 1300, i = 0;
    el.textContent = fmt(0);
    var iv = setInterval(function () {
      i++;
      var tt = Math.min(1, i / steps);
      var e = 1 - Math.pow(1 - tt, 3);
      el.textContent = fmt(Math.round(target * e));
      if (tt >= 1) { clearInterval(iv); el.textContent = raw; }
    }, dur / steps);
  }

  /* ---------------- [data-reveal] group reveal ---------------- */

  function primeGroup(g) {
    if (primed.has(g)) return;
    primed.add(g);
    var r = g.getBoundingClientRect();
    if (r.bottom < 0) { seen.add(g); return; } // scrolled past — leave visible
    var kids = g.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      el.style.opacity = '0';
      el.style.transform = 'translateY(' + G_DIST + ')';
      el.style.transition = 'opacity ' + G_DUR + 'ms ' + EASE + ' ' + (i * G_STAG) + 'ms, transform ' + G_DUR + 'ms ' + EASE + ' ' + (i * G_STAG) + 'ms';
    }
  }

  function revealGroup(g) {
    if (seen.has(g)) return;
    seen.add(g);
    var kids = g.children, n = kids.length;
    for (var i = 0; i < n; i++) {
      var el = kids[i];
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }
    // extras
    var counts = g.querySelectorAll('[data-count]');
    for (var c = 0; c < counts.length; c++) countUp(counts[c]);
    var nodes = g.querySelectorAll('.tl-node-v6');
    for (var d = 0; d < nodes.length; d++) (function (node, di) {
      setTimeout(function () { node.classList.add('is-active'); }, di * 140);
    })(nodes[d], d);
    var progs = g.querySelectorAll('.tl-progress-v6');
    for (var p = 0; p < progs.length; p++) (function (prog) {
      setTimeout(function () { prog.classList.add('is-filled'); }, 200);
    })(progs[p]);
    // hand style control back after the transition so hover effects work
    setTimeout(function () {
      for (var i = 0; i < kids.length; i++) {
        kids[i].style.removeProperty('opacity');
        kids[i].style.removeProperty('transform');
        kids[i].style.removeProperty('transition');
      }
    }, G_DUR + n * G_STAG + 80);
  }

  /* ---------------- main tick: live queries, no stale caches ---------------- */

  function tick() {
    if (!document.body) return;
    var vh = window.innerHeight || document.documentElement.clientHeight;

    // fm-rv (+ .spot-card, which uses the same single-element reveal)
    var fms = document.querySelectorAll('.fm-rv, .spot-card');
    for (var i = 0; i < fms.length; i++) {
      var el = fms[i];
      if (!primed.has(el)) primeFm(el);
      if (seen.has(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92) { seen.add(el); revealFm(el); }
    }

    // data-reveal groups
    var groups = document.querySelectorAll('[data-reveal]');
    for (var gI = 0; gI < groups.length; gI++) {
      var g = groups[gI];
      if (!primed.has(g)) primeGroup(g);
      if (seen.has(g)) continue;
      var gr = g.getBoundingClientRect();
      if (gr.top < vh * 0.9) revealGroup(g); // includes anything above the viewport
    }

    // bare timeline spines (Process page) — fill when they enter the viewport
    var spines = document.querySelectorAll('.tl-progress-v6:not(.is-filled)');
    for (var sI = 0; sI < spines.length; sI++) {
      var sp = spines[sI];
      var sr = sp.getBoundingClientRect();
      if (sr.top < vh * 0.92) sp.classList.add('is-filled');
    }

    // scroll progress bars
    var bars = document.querySelectorAll('[data-scroll-progress]');
    if (bars.length) {
      var max = document.documentElement.scrollHeight - vh;
      var pc = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      for (var b = 0; b < bars.length; b++) bars[b].style.width = pc + '%';
    }
  }

  function start() {
    tick();
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick, { passive: true });
    setInterval(tick, 300); // safety net: catches remounts, dynamic content, missed events
    var mo = new MutationObserver(function () { tick(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
