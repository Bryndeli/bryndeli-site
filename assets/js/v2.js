/* Bryndeli v2 — shared motion. No dependencies. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Split [data-split] headings into words that rise in (keeps <em> styling)
  var n = 0;
  function split(node, out) {
    Array.prototype.slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 3) {
        c.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { out.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'), i = document.createElement('span');
          w.className = 'w'; i.textContent = t; i.style.setProperty('--i', n++); w.appendChild(i); out.appendChild(w);
        });
      } else if (c.nodeType === 1) {
        var el = c.cloneNode(false); split(c, el); out.appendChild(el);
      }
    });
  }
  document.querySelectorAll('[data-split]').forEach(function (h) {
    var label = h.textContent.replace(/\s+/g, ' ').trim(), out = h.cloneNode(false);
    n = 0; split(h, out);
    h.setAttribute('aria-label', label);
    h.innerHTML = out.innerHTML;
    h.querySelectorAll('.w').forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
  });

  // Nav + progress bar
  var nav = document.getElementById('nav'), bar = document.getElementById('progress');
  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', scrollY > 20);
    if (bar) { var h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')'; }
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Reveal on scroll + count up
  function count(el) {
    var to = +el.dataset.count, pre = el.dataset.prefix || '', t0 = performance.now();
    if (reduce || !to) { el.textContent = pre + to; return; }
    (function f(t) { var p = Math.min((t - t0) / 1200, 1); el.textContent = pre + Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('[data-count]').forEach(count);
      io.unobserve(e.target);
    });
  }, { threshold: .2 });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  if (reduce) return;

  // Hero art follows the pointer
  var art = document.getElementById('art');
  if (art) addEventListener('pointermove', function (e) {
    art.style.setProperty('--mx', (e.clientX / innerWidth - .5).toFixed(3));
    art.style.setProperty('--my', (e.clientY / innerHeight - .5).toFixed(3));
  }, { passive: true });

  // Card tilt
  document.querySelectorAll('[data-tilt]').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = 'perspective(900px) rotateY(' + (x * 5) + 'deg) rotateX(' + (-y * 5) + 'deg) translateY(-4px)';
    });
    c.addEventListener('pointerleave', function () { c.style.transform = ''; });
  });

  // Magnetic buttons
  document.querySelectorAll('[data-magnet]').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .15) + 'px,' + ((e.clientY - r.top - r.height / 2) * .25) + 'px)';
    });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });
})();
