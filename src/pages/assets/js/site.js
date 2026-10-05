// 共用：深淺色、分段背景色、捲動淡入、作品輪播、經歷時間軸
(() => {
  const L = (l, c, h) => `oklch(${l} ${c} ${h})`;
  const PAL = {
    light: {
      a: [L(.968,.004,250), L(.21,.012,255), L(.47,.012,255), L(.86,.006,255), L(.995,.002,250), 0],
      b: [L(.925,.007,250), L(.21,.012,255), L(.45,.012,255), L(.82,.008,255), L(.975,.004,250), 0],
      c: [L(.988,.002,250), L(.21,.012,255), L(.47,.012,255), L(.87,.006,255), L(.955,.004,250), 0],
      ink: [L(.22,.012,255), L(.96,.004,250), L(.74,.01,255), L(.36,.012,255), L(.27,.012,255), 1],
    },
    dark: {
      a: [L(.185,.008,255), L(.95,.004,250), L(.72,.01,255), L(.32,.01,255), L(.225,.009,255), 1],
      b: [L(.225,.01,255), L(.95,.004,250), L(.74,.01,255), L(.35,.01,255), L(.26,.01,255), 1],
      c: [L(.16,.007,255), L(.95,.004,250), L(.72,.01,255), L(.3,.01,255), L(.2,.008,255), 1],
      ink: [L(.95,.004,250), L(.2,.012,255), L(.45,.012,255), L(.84,.006,255), L(.99,.002,250), 0],
    },
  };
  const KEY = 'seansun-theme';
  const root = document.documentElement;
  root.classList.add('js');
  let theme = localStorage.getItem(KEY) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  let tone = 'a', last = '';

  function apply() {
    const k = theme + tone; if (k === last) return; last = k;
    const [bg, fg, muted, line, card, dark] = PAL[theme][tone] || PAL[theme].a, s = root.style;
    s.setProperty('--bg', bg); s.setProperty('--fg', fg); s.setProperty('--muted', muted);
    s.setProperty('--line', line); s.setProperty('--card', card);
    s.setProperty('--accent-text', dark ? L(.78,.14,150) : L(.48,.12,150));
    s.colorScheme = dark ? 'dark' : 'light';
    const lbl = document.querySelector('[data-theme-label]');
    if (lbl) lbl.textContent = theme === 'light' ? '深色' : '淺色';
  }
  apply();

  function init() {
    last = ''; apply();
    document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
      theme = theme === 'light' ? 'dark' : 'light'; localStorage.setItem(KEY, theme); apply();
    });

    // 捲動淡入
    const els = document.querySelectorAll('[data-reveal]');
    els.forEach(el => { if (el.dataset.delay) el.style.transitionDelay = el.dataset.delay + 'ms'; });
    const reveal = () => { const vh = innerHeight; els.forEach(el => { if (el.classList.contains('in')) return; const r = el.getBoundingClientRect(); if (r.top < vh * .94 && r.bottom > 0) el.classList.add('in'); }); };
    reveal(); requestAnimationFrame(reveal);
    addEventListener('scroll', reveal, { passive: true }); addEventListener('resize', reveal);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
      els.forEach(el => io.observe(el));
    }
    setTimeout(() => { const vh = innerHeight; els.forEach(el => { if (el.getBoundingClientRect().top < vh) el.classList.add('in'); }); }, 1500);

    // 分段背景色 + 時間軸
    const tones = [...document.querySelectorAll('[data-tone]')];
    const tl = document.querySelector('.tl'), fill = document.querySelector('.tl-fill');
    const onScroll = () => {
      const vh = innerHeight, mid = vh * .55; let t = 'a';
      for (const el of tones) { const r = el.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) t = el.dataset.tone; }
      if (t !== tone) { tone = t; apply(); }
      if (tl && fill) { const r = tl.getBoundingClientRect(); fill.style.transform = `scaleY(${Math.min(1, Math.max(0, (vh * .7 - r.top) / r.height)).toFixed(3)})`; }
    };
    addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

    // 作品輪播
    const track = document.querySelector('.track');
    if (track) {
      const counter = document.querySelector('[data-counter]'), bar = document.querySelector('.bar i');
      const n = track.children.length, pad = v => String(v).padStart(2, '0');
      const upd = () => {
        const max = Math.max(1, track.scrollWidth - track.clientWidth), p = Math.min(1, track.scrollLeft / max);
        const i = Math.min(n, Math.round(p * (n - 1)) + 1);
        if (bar) bar.style.width = (i / n * 100).toFixed(1) + '%';
        if (counter) counter.textContent = `${pad(i)} / ${pad(n)}`;
      };
      const step = d => { const c = track.firstElementChild; track.scrollBy({ left: d * (c ? c.getBoundingClientRect().width + 28 : track.clientWidth * .8), behavior: 'smooth' }); };
      track.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
      document.querySelector('[data-prev]')?.addEventListener('click', () => step(-1));
      document.querySelector('[data-next]')?.addEventListener('click', () => step(1));
    }

    // 作品頁分類
    const tabs = document.querySelectorAll('[data-filter]');
    const setFilter = f => {
      tabs.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === f)));
      document.querySelectorAll('.list a').forEach(a => { a.hidden = f !== 'all' && a.dataset.kind !== f; });
    };
    tabs.forEach(b => b.addEventListener('click', () => { setFilter(b.dataset.filter); history.replaceState(null, '', b.dataset.filter === 'all' ? location.pathname : '#' + b.dataset.filter); }));
    if (tabs.length) setFilter(['project', 'lab'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'all');

    // 圖片缺檔時顯示佔位
    document.querySelectorAll('img[data-fallback]').forEach(img => {
      const fail = () => { const d = document.createElement('div'); d.className = img.dataset.fallbackClass || 'empty'; d.textContent = img.dataset.fallback; img.replaceWith(d); };
      img.addEventListener('error', fail);
      if (img.dataset.src) img.src = img.dataset.src; else if (img.complete && !img.naturalWidth) fail();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
