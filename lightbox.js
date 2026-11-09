// Lightbox: klik gambar [data-zoom] → pop-up yang membesar dari posisi gambar, bisa di-zoom & digeser.
// Zoom: pinch (HP), scroll / tombol +- (PC), ketuk/klik 2× di titik tertentu. Geser kiri/kanan = gambar lain
// (satu grup: data-zoom="nama-grup"), geser ke bawah / Esc / tombol × = tutup. Tanpa library.
(function () {
  var MAX = 4;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css =
    '.lb{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;touch-action:none;-webkit-user-select:none;user-select:none}' +
    '.lb-bg{position:absolute;inset:0;background:rgba(4,10,22,.86);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .3s}' +
    '.lb.on .lb-bg{opacity:1}' +
    '.lb-stage{position:absolute;inset:0;overflow:hidden}' +
    '.lb-img{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;border-radius:12px;box-shadow:0 30px 80px rgba(0,0,0,.6);max-width:none;cursor:zoom-in}' +
    '.lb.zoomed .lb-img{cursor:grab;border-radius:0}' +
    '.lb-ui{position:absolute;display:flex;gap:8px;z-index:2;opacity:0;transform:translateY(-8px);transition:opacity .3s .1s,transform .4s .1s cubic-bezier(.32,1.45,.5,1)}' +
    '.lb.on .lb-ui{opacity:1;transform:none}' +
    '.lb-top{top:max(14px,env(safe-area-inset-top));right:14px;left:14px;justify-content:space-between;align-items:center}' +
    '.lb-bot{bottom:max(18px,env(safe-area-inset-bottom));left:50%;translate:-50% 0;align-items:center}' +
    '.lb-btn{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;border:1px solid rgba(255,255,255,.22);background:rgba(18,43,78,.6);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;cursor:pointer;font:600 20px/1 system-ui;transition:transform .3s cubic-bezier(.32,1.45,.5,1),background .2s}' +
    '.lb-btn:hover{background:rgba(31,178,236,.35)}.lb-btn:active{transform:scale(.88)}.lb-btn[hidden]{display:none}' +
    '.lb-btn svg{width:20px;height:20px}' +
    '.lb-cap{max-width:min(560px,70vw);padding:8px 14px;border-radius:12px;background:rgba(18,43,78,.6);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#e4eefa;font:500 13px/1.4 system-ui;text-align:center}' +
    '.lb-count{font:600 12px ui-monospace,monospace;color:#a9beda;padding:0 6px}' +
    '.lb-nav{position:absolute;top:50%;translate:0 -50%;z-index:2}.lb-prev{left:12px}.lb-next{right:12px}' +
    '.lb-hint{position:absolute;bottom:calc(max(18px,env(safe-area-inset-bottom)) + 58px);left:50%;translate:-50% 0;z-index:2;color:#a9beda;font:500 12px system-ui;opacity:0;transition:opacity .4s .5s;pointer-events:none;white-space:nowrap}' +
    '.lb.on .lb-hint{opacity:1}.lb.zoomed .lb-hint{opacity:0;transition-delay:0s}' +
    '@media (max-width:640px){.lb-nav{display:none}}' +
    '[data-zoom]{cursor:zoom-in}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var ico = {
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    l: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    r: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 12h12"/></svg>',
  };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  function open(thumb) {
    var grup = thumb.getAttribute('data-zoom');
    var list = grup ? [].slice.call(document.querySelectorAll('[data-zoom="' + grup + '"]')) : [thumb];
    var idx = Math.max(0, list.indexOf(thumb));
    var prevFocus = document.activeElement;

    var root = el('div', 'lb');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Pratinjau gambar');
    var bg = el('div', 'lb-bg');
    var stage = el('div', 'lb-stage');
    var img = el('img', 'lb-img');
    img.draggable = false;
    stage.appendChild(img);
    var top = el('div', 'lb-ui lb-top');
    var count = el('span', 'lb-count');
    var bClose = el('button', 'lb-btn', ico.x);
    bClose.setAttribute('aria-label', 'Tutup');
    top.appendChild(count);
    top.appendChild(bClose);
    var bot = el('div', 'lb-ui lb-bot');
    var bOut = el('button', 'lb-btn', ico.minus);
    bOut.setAttribute('aria-label', 'Perkecil');
    var cap = el('span', 'lb-cap');
    var bIn = el('button', 'lb-btn', ico.plus);
    bIn.setAttribute('aria-label', 'Perbesar');
    bot.appendChild(bOut);
    bot.appendChild(cap);
    bot.appendChild(bIn);
    var bPrev = el('button', 'lb-btn lb-ui lb-nav lb-prev', ico.l);
    bPrev.setAttribute('aria-label', 'Sebelumnya');
    var bNext = el('button', 'lb-btn lb-ui lb-nav lb-next', ico.r);
    bNext.setAttribute('aria-label', 'Berikutnya');
    var hint = el('div', 'lb-hint');
    hint.textContent = matchMedia('(pointer:coarse)').matches ? 'cubit untuk zoom · ketuk 2× · geser ke bawah untuk tutup' : 'scroll untuk zoom · klik 2× · Esc untuk tutup';
    [bg, stage, top, bot, bPrev, bNext, hint].forEach(function (n) {
      root.appendChild(n);
    });
    document.body.appendChild(root);
    var overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    // posisi: s = skala, x/y = geser (px). fit = skala "pas layar"
    var s = 1, x = 0, y = 0, fit = 1, nw = 1, nh = 1;
    function apply(anim) {
      img.style.transition = anim && !reduce ? 'transform .45s cubic-bezier(.32,1.25,.5,1)' : 'none';
      img.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
      root.classList.toggle('zoomed', s > fit * 1.05);
    }
    function center() {
      var W = innerWidth, H = innerHeight, pad = W < 640 ? 16 : 70;
      fit = Math.min((W - pad * 2) / nw, (H - 150) / nh, 1.5);
      s = fit;
      x = (W - nw * s) / 2;
      y = (H - nh * s) / 2;
    }
    function clamp() {
      var W = innerWidth, H = innerHeight, w = nw * s, h = nh * s;
      x = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, x));
      y = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, y));
    }
    function zoomAt(ns, px, py, anim) {
      ns = Math.max(fit, Math.min(fit * MAX, ns));
      x = px - ((px - x) / s) * ns;
      y = py - ((py - y) / s) * ns;
      s = ns;
      clamp();
      apply(anim);
    }

    function show(i, dari) {
      idx = (i + list.length) % list.length;
      var t = list[idx];
      var src = t.getAttribute('data-src') || t.currentSrc || t.src;
      cap.textContent = t.getAttribute('data-caption') || t.alt || '';
      cap.hidden = !cap.textContent;
      count.textContent = list.length > 1 ? idx + 1 + ' / ' + list.length : '';
      bPrev.hidden = bNext.hidden = list.length < 2;
      var pre = new Image();
      pre.onload = function () {
        nw = pre.naturalWidth;
        nh = pre.naturalHeight;
        img.src = src;
        img.alt = t.alt || '';
        img.style.width = nw + 'px';
        img.style.height = nh + 'px';
        center();
        if (dari && !reduce) {
          // FLIP: mulai tepat di atas thumbnail, lalu memantul ke tengah
          var r = t.getBoundingClientRect(), fs = s, fx = x, fy = y;
          s = r.width / nw;
          x = r.left;
          y = r.top;
          apply(false);
          img.getBoundingClientRect();
          s = fs;
          x = fx;
          y = fy;
          apply(true);
        } else {
          apply(false);
          if (!reduce) img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
        }
      };
      pre.src = src;
    }

    function close() {
      document.removeEventListener('keydown', onKey);
      removeEventListener('resize', onResize);
      root.classList.remove('on');
      var t = list[idx], r = t.getBoundingClientRect();
      if (!reduce && r.width && r.bottom > 0 && r.top < innerHeight) {
        s = r.width / nw;
        x = r.left;
        y = r.top;
        img.style.transition = 'transform .32s cubic-bezier(.5,0,.25,1)';
        img.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
      } else {
        img.style.transition = 'opacity .2s';
        img.style.opacity = '0';
      }
      setTimeout(function () {
        root.remove();
        document.documentElement.style.overflow = overflow;
        if (prevFocus && prevFocus.focus) prevFocus.focus();
      }, reduce ? 0 : 320);
    }

    function onKey(e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === '+' || e.key === '=') zoomAt(s * 1.5, innerWidth / 2, innerHeight / 2, true);
      else if (e.key === '-') zoomAt(s / 1.5, innerWidth / 2, innerHeight / 2, true);
    }
    function onResize() {
      center();
      apply(false);
    }
    document.addEventListener('keydown', onKey);
    addEventListener('resize', onResize);
    bClose.onclick = close;
    bPrev.onclick = function () { show(idx - 1); };
    bNext.onclick = function () { show(idx + 1); };
    bIn.onclick = function () { zoomAt(s * 1.6, innerWidth / 2, innerHeight / 2, true); };
    bOut.onclick = function () { zoomAt(s / 1.6, innerWidth / 2, innerHeight / 2, true); };

    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoomAt(s * Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY, false);
    }, { passive: false });

    // pointer: 1 jari = geser / swipe, 2 jari = pinch, ketuk 2× = zoom
    var pts = new Map(), start = null, lastTap = 0, moved = false;
    stage.addEventListener('pointerdown', function (e) {
      stage.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
      if (pts.size === 1) start = { px: e.clientX, py: e.clientY, x: x, y: y, s: s, t: Date.now() };
      if (pts.size === 2) {
        var a = [].slice.call(pts.values());
        start = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), s: s, cx: (a[0].x + a[1].x) / 2, cy: (a[0].y + a[1].y) / 2, x: x, y: y };
      }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!pts.has(e.pointerId) || !start) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && start.d) {
        var a = [].slice.call(pts.values());
        var d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        var ns = Math.max(fit * 0.8, Math.min(fit * MAX, (start.s * d) / start.d));
        var cx = (a[0].x + a[1].x) / 2, cy = (a[0].y + a[1].y) / 2;
        x = cx - ((start.cx - start.x) / start.s) * ns;
        y = cy - ((start.cy - start.y) / start.s) * ns;
        s = ns;
        moved = true;
        apply(false);
        return;
      }
      var dx = e.clientX - start.px, dy = e.clientY - start.py;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (s > fit * 1.05) {
        x = start.x + dx;
        y = start.y + dy;
        apply(false);
      } else {
        // belum di-zoom: ikut jari; ke bawah juga memudarkan latar (tarik untuk tutup)
        x = start.x + (Math.abs(dx) > Math.abs(dy) ? dx : 0);
        y = start.y + (Math.abs(dy) >= Math.abs(dx) ? Math.max(0, dy) : 0);
        bg.style.opacity = String(1 - Math.min(0.7, Math.max(0, dy) / 400));
        apply(false);
      }
    });
    function up(e) {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size) {
        var p = [].slice.call(pts.values())[0];
        start = { px: p.x, py: p.y, x: x, y: y, s: s, t: Date.now() };
        return;
      }
      bg.style.opacity = '';
      var dx = e.clientX - start.px, dy = e.clientY - start.py;
      var zoomed = s > fit * 1.05;
      if (!moved) {
        var now = Date.now();
        if (now - lastTap < 300) {
          zoomAt(zoomed ? fit : fit * 2.5, e.clientX, e.clientY, true);
          lastTap = 0;
        } else {
          lastTap = now;
          // ketuk latar (di luar gambar) = tutup
          var r = img.getBoundingClientRect();
          if (!zoomed && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) setTimeout(function () { if (lastTap === now) close(); }, 300);
        }
      } else if (!zoomed && dy > 110 && Math.abs(dy) > Math.abs(dx)) {
        close();
        return;
      } else if (!zoomed && Math.abs(dx) > 70 && list.length > 1) {
        show(idx + (dx < 0 ? 1 : -1));
        return;
      } else if (s < fit) {
        center();
        apply(true);
        return;
      }
      if (!zoomed && moved) {
        center();
        apply(true);
      } else {
        clamp();
        apply(true);
      }
      start = null;
    }
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);

    show(idx, true);
    requestAnimationFrame(function () {
      root.classList.add('on');
      bClose.focus({ preventScroll: true });
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-zoom]');
    if (!t || t.tagName !== 'IMG') return;
    e.preventDefault();
    open(t);
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('img[data-zoom]')) {
      e.preventDefault();
      open(e.target);
    }
  });
  [].forEach.call(document.querySelectorAll('img[data-zoom]'), function (i) {
    i.tabIndex = 0;
    i.setAttribute('role', 'button');
  });
})();
