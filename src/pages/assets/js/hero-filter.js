// Hero：即時影像濾波（滑鼠放大鏡 / 鏡頭）
(() => {
  const W = 800, H = 600, P = 320, PH = 240, ACC = '#3fae6a';
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
    const label = () => { tag.textContent = stream ? 'LIVE · 鏡頭' : loaded ? '形象照 · 移動游標' : '載入中…'; };

    function setFilter(id) {
      filter = id; const f = FILTERS[id];
      document.querySelectorAll('[data-filter-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filterBtn === id)));
      kernel.innerHTML = ''; kernel.style.gridTemplateColumns = f.rows.length ? `repeat(${f.rows[0].length}, 30px)` : 'none';
      kernel.hidden = !f.rows.length;
      f.rows.flat().forEach(v => { const s = document.createElement('span'); s.textContent = v; kernel.appendChild(s); });
      note.textContent = f.note; tWrap.hidden = id !== 'otsu';
    }

    function frame(t) {
      requestAnimationFrame(frame);
      if (!src) return;
      let A = src, B = filt[filter], th = staticT;
      if (stream && video && video.readyState >= 2 && video.videoWidth) {
        const px = proc.getContext('2d', { willReadFrequently: true });
        const sc = Math.min(video.videoWidth/4, video.videoHeight/3), sw = sc*4, sh = sc*3;
        px.save(); px.translate(P, 0); px.scale(-1, 1); px.drawImage(video, (video.videoWidth-sw)/2, (video.videoHeight-sh)/2, sw, sh, 0, 0, P, PH); px.restore();
        const r = run(filter, toGray(px.getImageData(0, 0, P, PH).data, P*PH), P, PH);
        paint(camB, r.out, P, PH); A = proc; B = camB; if (r.t != null) th = r.t;
      }
      if (filter === 'otsu') tOut.textContent = th;
      const tx = ptr ? ptr.x : W/2 + Math.cos(t*.00042) * W*.22, ty = ptr ? ptr.y : H/2 + Math.sin(t*.00063) * H*.2;
      lens.x += (tx - lens.x) * .12; lens.y += (ty - lens.y) * .12;
      const { x, y } = lens, R = H * .17;
      ctx.drawImage(A, 0, 0, W, H);
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2); ctx.clip(); ctx.drawImage(B, 0, 0, W, H); ctx.restore();
      ctx.lineWidth = 2; ctx.strokeStyle = ACC; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2); ctx.stroke();
      const code = FILTERS[filter].code; ctx.font = '500 11px "IBM Plex Mono", monospace';
      const lw = ctx.measureText(code).width + 14, lx = Math.min(W-lw-6, Math.max(6, x-lw/2)), ly = Math.min(H-26, y+R+8);
      ctx.fillStyle = ACC; ctx.fillRect(lx, ly, lw, 20); ctx.fillStyle = '#0f1a13'; ctx.fillText(code, lx+7, ly+14);
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
    canvas.addEventListener('pointermove', e => { ptr = { x: e.offsetX / canvas.clientWidth * W, y: e.offsetY / canvas.clientHeight * H }; });
    canvas.addEventListener('pointerleave', () => { ptr = null; });
    addEventListener('pagehide', stopCam);

    build(null); setFilter('sobel'); label();
    load(canvas.dataset.photo);
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
