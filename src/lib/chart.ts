// 程式產生的影像測試圖（Siemens star、斜邊、zone plate、灰階階梯），
// 用來展示各種運算子的效果。尺寸以裝置像素計算。

export function drawTestChart(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#9aa0a7';
  ctx.fillRect(0, 0, w, h);

  const narrow = w < h * 1.6;
  const r = narrow ? Math.min(h * 0.2, w * 0.3) : Math.min(h * 0.38, w * 0.16);
  const cy = h * 0.52;
  const starX = narrow ? w * 0.3 : w * 0.18;
  const starY = narrow ? h * 0.32 : cy;
  const plateX = narrow ? w * 0.7 : w * 0.82;
  const plateY = narrow ? h * 0.72 : cy;
  const edgeX = narrow ? w * 0.72 : w * 0.5;
  const edgeY = narrow ? h * 0.3 : cy;

  // Siemens star
  const spokes = 36;
  for (let i = 0; i < spokes; i++) {
    const a0 = (i / spokes) * Math.PI * 2;
    const a1 = ((i + 1) / spokes) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(starX, starY);
    ctx.arc(starX, starY, r, a0, a1);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? '#e8ebee' : '#1d2228';
    ctx.fill();
  }

  // 斜邊（MTF slanted edge）
  const side = narrow ? r * 1.1 : Math.min(h * 0.4, w * 0.15);
  ctx.fillStyle = '#e8ebee';
  ctx.fillRect(edgeX - side * 0.8, edgeY - side * 0.8, side * 1.6, side * 1.6);
  ctx.save();
  ctx.translate(edgeX, edgeY);
  ctx.rotate((5 * Math.PI) / 180);
  ctx.fillStyle = '#262b31';
  ctx.fillRect(-side / 2, -side / 2, side, side);
  ctx.restore();

  // 灰階階梯與漸層
  const bx = narrow ? w * 0.06 : w * 0.34;
  const bw = narrow ? w * 0.42 : w * 0.32;
  const bh = Math.max(10, h * 0.07);
  const steps = 11;
  const stepY = narrow ? h * 0.62 : h * 0.06;
  const rampY = narrow ? h * 0.8 : h * 0.87;
  for (let i = 0; i < steps; i++) {
    const v = Math.round((i / (steps - 1)) * 255);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(bx + (bw / steps) * i, stepY, bw / steps + 0.5, bh);
  }
  const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  grad.addColorStop(0, '#000');
  grad.addColorStop(1, '#fff');
  ctx.fillStyle = grad;
  ctx.fillRect(bx, rampY, bw, bh);
  ctx.restore();

  // Zone plate：頻率隨半徑增加
  const zx = Math.round(plateX);
  const zy = Math.round(plateY);
  const zr = Math.round(r);
  const x0 = Math.max(0, zx - zr);
  const y0 = Math.max(0, zy - zr);
  const iw = Math.min(zr * 2, w - x0);
  const ih = Math.min(zr * 2, h - y0);
  if (iw > 0 && ih > 0) {
    const img = ctx.getImageData(x0, y0, iw, ih);
    const d = img.data;
    const n = 0.18 * zr;
    for (let y = 0; y < ih; y++) {
      for (let x = 0; x < iw; x++) {
        const dx = x0 + x - zx;
        const dy = y0 + y - zy;
        const d2 = dx * dx + dy * dy;
        if (d2 > zr * zr) continue;
        const v = 128 + 112 * Math.cos((Math.PI * n * d2) / (zr * zr));
        const p = (y * iw + x) * 4;
        d[p] = d[p + 1] = d[p + 2] = v;
      }
    }
    ctx.putImageData(img, x0, y0);
  }

  return { star: { x: starX, y: starY }, edge: { x: edgeX, y: edgeY }, plate: { x: plateX, y: plateY } };
}
