// CodeOutfitters shared motion system (Fable polish pass)
// Scroll-reveal with sibling stagger + reduced-motion safety.
// Elements opt in with class="fm-rv". Inline styles are cleared after reveal
// so existing hover transitions (e.g. .spot-card) keep working.
(function () {
  'use strict';

  // Always inject reduced-motion safety, even if the rest never runs.
  var rmStyle = document.createElement('style');
  rmStyle.textContent =
    '@media (prefers-reduced-motion: reduce){*,*::before,*::after{' +
    'animation-duration:.001ms!important;animation-iteration-count:1!important;' +
    'transition-duration:.001ms!important;scroll-behavior:auto!important}}';
  document.head.appendChild(rmStyle);

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return; // content stays fully visible, no reveal animation

  var EASE = 'cubic-bezier(.16,1,.3,1)';
  var DIST = '22px';
  var DUR = 700;      // ms
  var STAG = 70;      // ms per sibling
  var seen = (typeof WeakSet !== 'undefined') ? new WeakSet() : { has: function(){return false;}, add: function(){} };

  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }) : null;

  function siblingIndex(el) {
    var i = 0, p = el.parentElement;
    if (!p) return 0;
    var kids = p.children;
    for (var k = 0; k < kids.length; k++) {
      if (kids[k] === el) return Math.min(i, 8); // cap stagger
      if (kids[k].classList && kids[k].classList.contains('fm-rv')) i++;
    }
    return 0;
  }

  function reveal(el) {
    var delay = siblingIndex(el) * STAG;
    el.style.transition = 'opacity ' + DUR + 'ms ' + EASE + ' ' + delay + 'ms, transform ' + DUR + 'ms ' + EASE + ' ' + delay + 'ms';
    // force style flush so transition applies
    void el.offsetWidth;
    el.style.opacity = '1';
    el.style.transform = 'none';
    setTimeout(function () {
      // hand control back to stylesheet hover transitions
      el.style.removeProperty('opacity');
      el.style.removeProperty('transform');
      el.style.removeProperty('transition');
      el.style.removeProperty('will-change');
    }, DUR + delay + 60);
  }

  function prime(el) {
    if (seen.has(el)) return;
    seen.add(el);
    var r = el.getBoundingClientRect();
    // Already well above the fold's bottom edge on load? Skip hiding to avoid flicker on anchors.
    if (r.bottom < 0) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(' + DIST + ')';
    el.style.willChange = 'opacity, transform';
    if (io) io.observe(el);
    else reveal(el);
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    var list = root.querySelectorAll('.fm-rv');
    for (var i = 0; i < list.length; i++) prime(list[i]);
    if (root.classList && root.classList.contains('fm-rv')) prime(root);
  }

  function start() {
    scan(document.body);
    var mo = new MutationObserver(function (muts) {
      for (var m = 0; m < muts.length; m++) {
        var added = muts[m].addedNodes;
        for (var n = 0; n < added.length; n++) {
          if (added[n].nodeType === 1) scan(added[n]);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
