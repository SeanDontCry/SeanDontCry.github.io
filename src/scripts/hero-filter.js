// Hero：即時影像濾波（滑鼠放大鏡 / 鏡頭）
(() => {
  // 長寬比只需改 index.html canvas 上的 data-ratio，例如 "4/3"、"1/1"、"3/4"、"16/9"
  let W = 800, H = 600, P = 320, PH = 240;
  const ACC = '#3fae6a';
  const FILTERS = {
    sobel: { code: 'SOBEL 3×3', rows: [['−1','0','+1'],['−2','0','+2'],['−1','0','+1']], note: 'Gx 卷積核；Gy 為其轉置，輸出 √(Gx² + Gy²)。' },
    laplacian: { code: 'LAPLACIAN', rows: [['0','1','0'],['1','−4','1'],['0','1','0']], note: '先高斯平滑，再取二階導數的絕對值。' },
    gauss: { code: 'GAUSSIAN 5×5', rows: [['1','4','6','4','1']], note: '÷16，水平與垂直方向各卷積一次。' },
    otsu: { code: 'OTSU', rows: [], note: '自動選擇使類間變異數最大的門檻。' },
  };

  const toGray = (d, n) => { const g = new Float32Array(n); for (let i = 0; i < n; i++) g[i] = .299*d[i*4] + .587*d[i*4+1] + .114*d[i*4+2]; return g; };
  function gauss(g, w, h) {
    const k = [1,4,6,4,1], t = new Float32Array(w*h), o = new Float32Array(w*h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let j = -2; j <= 2; j++) s += k[j+2] * g[y*w + Math.min(w-1, Math.max(0, x+j))]; t[y*w+x] = s/16; }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let j = -2; j <= 2; j++) s += k[j+2] * t[Math.min(h-1, Math.max(0, y+j))*w + x]; o[y*w+x] = s/16; }
    return o;
  }
  function sobel(g, w, h) {
    const o = new Float32Array(w*h);
    for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
      const i = y*w+x;
      const gx = -g[i-w-1] + g[i-w+1] - 2*g[i-1] + 2*g[i+1] - g[i+w-1] + g[i+w+1];
      const gy = -g[i-w-1] - 2*g[i-w] - g[i-w+1] + g[i+w-1] + 2*g[i+w] + g[i+w+1];
      o[i] = Math.min(255, Math.sqrt(gx*gx + gy*gy) * .5);
    }
    return o;
  }
  function laplacian(g, w, h) {
    const s = gauss(g, w, h), o = new Float32Array(w*h);
    for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) { const i = y*w+x; o[i] = Math.min(255, Math.abs(s[i-w] + s[i+w] + s[i-1] + s[i+1] - 4*s[i]) * 5); }
    return o;
  }
  function otsu(g, n) {
    const hist = new Array(256).fill(0); for (let i = 0; i < n; i++) hist[Math.max(0, Math.min(255, g[i] | 0))]++;
    let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sB = 0, wB = 0, best = 0, t = 128;
    for (let i = 0; i < 256; i++) { wB += hist[i]; if (!wB) continue; const wF = n - wB; if (!wF) break; sB += i*hist[i]; const v = wB*wF*((sB/wB) - (sum-sB)/wF)**2; if (v > best) { best = v; t = i; } }
    const o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = g[i] > t ? 255 : 0;
    return { out: o, t };
  }
  const run = (id, g, w, h) => id === 'sobel' ? { out: sobel(g,w,h) } : id === 'laplacian' ? { out: laplacian(g,w,h) } : id === 'gauss' ? { out: gauss(g,w,h) } : otsu(g, w*h);
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function paint(c, arr, w, h) { const ctx = c.getContext('2d'), im = ctx.createImageData(w, h), d = im.data; for (let i = 0; i < w*h; i++) { d[i*4] = d[i*4+1] = d[i*4+2] = arr[i]; d[i*4+3] = 255; } ctx.putImageData(im, 0, 0); }

  function init() {
    const canvas = document.querySelector('[data-hero-canvas]'); if (!canvas) return;
    const [rw, rh] = (canvas.dataset.ratio || '4/3').split('/').map(Number);
    const RA = rw > 0 && rh > 0 ? rw / rh : 4 / 3;
    if (RA >= 1) { W = 800; H = Math.round(800 / RA); } else { H = 800; W = Math.round(800 * RA); }
    P = Math.round(W * .4); PH = Math.round(H * .4);
    canvas.width = W; canvas.height = H; canvas.style.aspectRatio = W + ' / ' + H;
    const frameEl = canvas.closest('.frame');
    if (frameEl) { const k = Math.min(1, RA / (4/3)); frameEl.style.width = (k * 100).toFixed(1) + '%'; frameEl.style.marginLeft = 'auto'; }
    const ctx = canvas.getContext('2d');
    const $ = s => document.querySelector(s);
    const tag = $('[data-source-label]'), kernel = $('[data-kernel]'), note = $('[data-filter-note]'), tOut = $('[data-otsu-t]'), tWrap = $('[data-otsu]');
    const camBtn = $('[data-cam]'), camLbl = $('[data-cam-label]'), camErr = $('[data-cam-error]'), file = $('[data-file]');
    let filter = 'sobel', src = null, filt = {}, staticT = 0, video = null, stream = null, ptr = null, lens = { x: W/2, y: H/2 }, loaded = false;
    const proc = mk(P, PH), camB = mk(P, PH);

    function build(img) {
      const c = mk(W, H), x = c.getContext('2d', { willReadFrequently: true });
      if (img) { const s = Math.max(W/img.width, H/img.height), w = img.width*s, h = img.height*s; x.drawImage(img, (W-w)/2, (H-h)/2, w, h); }
      else { x.fillStyle = '#e9ecef'; x.fillRect(0, 0, W, H); const cx = W/2, cy = H/2, R = H*.44, N = 36;
        for (let k = 0; k < N; k++) { x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R, k/N*Math.PI*2, (k+1)/N*Math.PI*2); x.closePath(); x.fillStyle = k % 2 ? '#e9ecef' : '#1f2328'; x.fill(); } }
      const im = x.getImageData(0, 0, W, H), d = im.data;
      for (let i = 0; i < d.length; i += 4) d[i] = d[i+1] = d[i+2] = .299*d[i] + .587*d[i+1] + .114*d[i+2];
      x.putImageData(im, 0, 0);
      const g = toGray(d, W*H), f = {};
      for (const id in FILTERS) { const r = run(id, g, W, H), fc = mk(W, H); paint(fc, r.out, W, H); f[id] = fc; if (r.t != null) staticT = r.t; }
      src = c; filt = f;
    }
    function load(url) {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => { try { build(img); loaded = true; label(); } catch (e) { build(null); } };
      img.onerror = () => { const fb = canvas.dataset.photoFallback; if (fb && url !== fb) load(fb); };
      img.src = url;
    }
    // PCB 小圖：同一組濾鏡，游標移入時顯示放大鏡
    function buildSet(img, w, h, label) {
      const c = mk(w, h), x = c.getContext('2d', { willReadFrequently: true });
      if (img) { const s = Math.max(w/img.width, h/img.height), iw = img.width*s, ih = img.height*s; x.drawImage(img, (w-iw)/2, (h-ih)/2, iw, ih); }
      else { x.fillStyle = '#e4ddcc'; x.fillRect(0, 0, w, h); x.strokeStyle = '#b8ae98'; x.lineWidth = 1;
        for (let k = -h; k < w; k += 14) { x.beginPath(); x.moveTo(k, h); x.lineTo(k + h, 0); x.stroke(); }
        x.fillStyle = '#6b604c'; x.font = '500 ' + Math.round(h*.07) + 'px "IBM Plex Mono", monospace'; x.textAlign = 'center'; x.fillText(label, w/2, h/2); }
      const g = toGray(x.getImageData(0, 0, w, h).data, w*h), f = {};
      for (const id in FILTERS) { const r = run(id, g, w, h), fc = mk(w, h); paint(fc, r.out, w, h); f[id] = fc; }
      return { src: c, filt: f };
    }
    const pcbs = [...document.querySelectorAll('[data-pcb]')].map(c => {
      const o = { c, ctx: c.getContext('2d'), set: null, img: undefined, ptr: null, lens: { x: 0, y: 0 }, a: 0, dirty: true, key: '' };
      const rebuild = () => {
        if (o.img === undefined) return;
        const dpr = Math.min(2, devicePixelRatio || 1), w = Math.max(40, Math.round(c.clientWidth * dpr)), h = Math.max(30, Math.round(c.clientHeight * dpr));
        if (w + 'x' + h === o.key && o.set) return; o.key = w + 'x' + h;
        c.width = w; c.height = h; o.lens = { x: w/2, y: h/2 };
        try { o.set = buildSet(o.img, w, h, 'PCB 電路板照片'); } catch (e) { o.set = buildSet(null, w, h, 'PCB 電路板照片'); }
        o.dirty = true;
      };
      const img = new Image(); img.onload = () => { o.img = img; rebuild(); }; img.onerror = () => { o.img = null; rebuild(); }; img.src = c.dataset.photo;
      if ('ResizeObserver' in window) { let to; new ResizeObserver(() => { clearTimeout(to); to = setTimeout(rebuild, 120); }).observe(c); }
      else addEventListener('resize', rebuild);
      return o;
    });
    // 共用放大鏡：以 .stage 為座標系，換算到每張（旋轉過的）canvas 內
    const stage = canvas.closest('.stage') || canvas.parentElement;
    const lensTag = document.createElement('div');
    lensTag.setAttribute('aria-hidden', 'true');
    lensTag.style.cssText = 'position:absolute;left:0;top:0;z-index:5;pointer-events:none;white-space:nowrap;padding:3px 7px;background:' + ACC + ';color:#0f1a13;font:500 11px/14px "IBM Plex Mono",monospace;letter-spacing:.04em;will-change:transform';
    stage.appendChild(lensTag);
    function toLocal(c, g, Rs, st) {
      const r = c.getBoundingClientRect(), cx = r.left + r.width/2 - st.left, cy = r.top + r.height/2 - st.top;
      const m = getComputedStyle(c.closest('.frame, .pcb') || c).transform;
      let a = 0; if (m && m !== 'none') { const v = m.match(/-?[\d.e]+/g).map(Number); a = Math.atan2(v[1], v[0]); }
      const dx = g.x - cx, dy = g.y - cy, cs = Math.cos(a), sn = Math.sin(a), k = c.width / (c.clientWidth || 1);
      return { x: (cs*dx + sn*dy + c.clientWidth/2) * k, y: (-sn*dx + cs*dy + c.clientHeight/2) * k, R: Rs * k };
    }
    function drawPcb(o, L) {
      if (!o.set) return;
      const { ctx } = o, h = o.c.height;
      ctx.drawImage(o.set.src, 0, 0);
      ctx.save(); ctx.beginPath(); ctx.arc(L.x, L.y, L.R, 0, Math.PI*2); ctx.clip(); ctx.drawImage(o.set.filt[filter], 0, 0); ctx.restore();
      ctx.lineWidth = Math.max(1.5, h/200); ctx.strokeStyle = ACC; ctx.beginPath(); ctx.arc(L.x, L.y, L.R, 0, Math.PI*2); ctx.stroke();
    }

    const label = () => { tag.textContent = stream ? 'LIVE' : loaded ? '移動游標' : '載入中…'; };

    function setFilter(id) {
      filter = id; const f = FILTERS[id];
      document.querySelectorAll('[data-filter-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filterBtn === id)));
      kernel.innerHTML = ''; kernel.style.gridTemplateColumns = f.rows.length ? `repeat(${f.rows[0].length}, 30px)` : 'none';
      kernel.hidden = !f.rows.length;
      f.rows.flat().forEach(v => { const s = document.createElement('span'); s.textContent = v; kernel.appendChild(s); });
      note.textContent = f.note; tWrap.hidden = id !== 'otsu';
      if (typeof pcbs !== 'undefined') pcbs.forEach(o => { o.dirty = true; });
    }

    function frame(t) {
      requestAnimationFrame(frame);
      const st = stage.getBoundingClientRect(), mr = canvas.getBoundingClientRect();
      const mcx = mr.left + mr.width/2 - st.left, mcy = mr.top + mr.height/2 - st.top;
      const tgx = ptr ? ptr.x : mcx + Math.cos(t*.00042) * canvas.clientWidth*.22, tgy = ptr ? ptr.y : mcy + Math.sin(t*.00063) * canvas.clientHeight*.2;
      if (!lens.init) lens = { x: tgx, y: tgy, init: true };
      lens.x += (tgx - lens.x) * .12; lens.y += (tgy - lens.y) * .12;
      const Rs = canvas.clientHeight * .17;
      pcbs.forEach(o => drawPcb(o, toLocal(o.c, lens, Rs, st)));
      const code = FILTERS[filter].code; if (lensTag.textContent !== code) lensTag.textContent = code;
      lensTag.style.transform = `translate(${(lens.x - lensTag.offsetWidth/2).toFixed(1)}px, ${(lens.y + Rs + 8).toFixed(1)}px)`;
      if (!src) return;
      let A = src, B = filt[filter], th = staticT;
      if (stream && video && video.readyState >= 2 && video.videoWidth) {
        const px = proc.getContext('2d', { willReadFrequently: true });
        const sc = Math.min(video.videoWidth/W, video.videoHeight/H), sw = sc*W, sh = sc*H;
        px.save(); px.translate(P, 0); px.scale(-1, 1); px.drawImage(video, (video.videoWidth-sw)/2, (video.videoHeight-sh)/2, sw, sh, 0, 0, P, PH); px.restore();
        const r = run(filter, toGray(px.getImageData(0, 0, P, PH).data, P*PH), P, PH);
        paint(camB, r.out, P, PH); A = proc; B = camB; if (r.t != null) th = r.t;
      }
      if (filter === 'otsu') tOut.textContent = th;
      const ML = toLocal(canvas, lens, Rs, st), x = ML.x, y = ML.y, R = ML.R;
      ctx.drawImage(A, 0, 0, W, H);
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2); ctx.clip(); ctx.drawImage(B, 0, 0, W, H); ctx.restore();
      ctx.lineWidth = 2; ctx.strokeStyle = ACC; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2); ctx.stroke();
    }

    async function startCam() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        video = document.createElement('video'); video.muted = true; video.playsInline = true; video.srcObject = stream; await video.play().catch(() => {});
        camErr.hidden = true;
      } catch (e) { stream = null; camErr.hidden = false; }
      syncCam();
    }
    function stopCam() { stream?.getTracks().forEach(t => t.stop()); stream = null; video = null; syncCam(); }
    function syncCam() { camBtn.classList.toggle('on', !!stream); camLbl.textContent = stream ? '關閉鏡頭' : '改用鏡頭'; label(); }

    document.querySelectorAll('[data-filter-btn]').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filterBtn)));
    camBtn.addEventListener('click', () => stream ? stopCam() : startCam());
    file.addEventListener('change', e => { const f = e.target.files?.[0]; if (f) load(URL.createObjectURL(f)); });
    stage.addEventListener('pointermove', e => { const s = stage.getBoundingClientRect(); ptr = { x: e.clientX - s.left, y: e.clientY - s.top }; });
    stage.addEventListener('pointerleave', () => { ptr = null; });
    addEventListener('pagehide', stopCam);

    build(null); setFilter('sobel'); label();
    load(canvas.dataset.photo);
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
