// 純 TypeScript 影像處理運算子，供首頁主視覺與互動 Demo 共用。
// 灰階影像以 Float32Array 儲存，數值範圍 0–255。

export type Gray = { w: number; h: number; data: Float32Array };

export const SOBEL_X = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];

export const LAPLACIAN = [
  [0, 1, 0],
  [1, -4, 1],
  [0, 1, 0],
];

export function toGray(img: ImageData): Gray {
  const { width: w, height: h, data } = img;
  const out = new Float32Array(w * h);
  for (let i = 0, p = 0; i < out.length; i++, p += 4) {
    out[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  return { w, h, data: out };
}

export function toImageData(g: Gray): ImageData {
  const img = new ImageData(g.w, g.h);
  const d = img.data;
  for (let i = 0, p = 0; i < g.data.length; i++, p += 4) {
    const v = g.data[i] < 0 ? 0 : g.data[i] > 255 ? 255 : g.data[i];
    d[p] = d[p + 1] = d[p + 2] = v;
    d[p + 3] = 255;
  }
  return img;
}

export function toCanvas(g: Gray): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = g.w;
  c.height = g.h;
  c.getContext('2d')!.putImageData(toImageData(g), 0, 0);
  return c;
}

const clampIdx = (v: number, max: number) => (v < 0 ? 0 : v > max ? max : v);

function rescale(raw: Float32Array, headroom = 0.6): Float32Array {
  let max = 0;
  for (let i = 0; i < raw.length; i++) if (raw[i] > max) max = raw[i];
  const k = max > 0 ? 255 / (max * headroom) : 0;
  for (let i = 0; i < raw.length; i++) raw[i] = Math.min(255, raw[i] * k);
  return raw;
}

export function sobel(g: Gray): Gray {
  const { w, h, data } = g;
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = clampIdx(y - 1, h - 1) * w;
    const y1 = y * w;
    const y2 = clampIdx(y + 1, h - 1) * w;
    for (let x = 0; x < w; x++) {
      const x0 = clampIdx(x - 1, w - 1);
      const x2 = clampIdx(x + 1, w - 1);
      const gx =
        -data[y0 + x0] + data[y0 + x2] - 2 * data[y1 + x0] + 2 * data[y1 + x2] - data[y2 + x0] + data[y2 + x2];
      const gy =
        -data[y0 + x0] - 2 * data[y0 + x] - data[y0 + x2] + data[y2 + x0] + 2 * data[y2 + x] + data[y2 + x2];
      out[y1 + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return { w, h, data: rescale(out) };
}

export function laplacian(g: Gray): Gray {
  const { w, h, data } = g;
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const up = clampIdx(y - 1, h - 1) * w;
    const row = y * w;
    const down = clampIdx(y + 1, h - 1) * w;
    for (let x = 0; x < w; x++) {
      const l = clampIdx(x - 1, w - 1);
      const r = clampIdx(x + 1, w - 1);
      out[row + x] = Math.abs(data[up + x] + data[down + x] + data[row + l] + data[row + r] - 4 * data[row + x]);
    }
  }
  return { w, h, data: rescale(out, 0.35) };
}

export function gaussianKernel(sigma: number): Float32Array {
  const radius = Math.max(1, Math.ceil(sigma * 3));
  const k = new Float32Array(radius * 2 + 1);
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k[i + radius] = v;
    sum += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  return k;
}

export function gaussianBlur(g: Gray, sigma: number): Gray {
  const { w, h, data } = g;
  const k = gaussianKernel(sigma);
  const r = (k.length - 1) / 2;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) s += data[row + clampIdx(x + i, w - 1)] * k[i + r];
      tmp[row + x] = s;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) s += tmp[clampIdx(y + i, h - 1) * w + x] * k[i + r];
      out[y * w + x] = s;
    }
  }
  return { w, h, data: out };
}

/** Otsu 法自動求二值化門檻，回傳 0–255 的整數。 */
export function otsu(g: Gray): number {
  const hist = new Float64Array(256);
  for (let i = 0; i < g.data.length; i++) hist[Math.max(0, Math.min(255, g.data[i] | 0))]++;
  const total = g.data.length;
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let bestT = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) {
      best = between;
      bestT = t;
    }
  }
  return bestT;
}

export function threshold(g: Gray, t: number): Gray {
  const out = new Float32Array(g.data.length);
  for (let i = 0; i < out.length; i++) out[i] = g.data[i] > t ? 255 : 0;
  return { w: g.w, h: g.h, data: out };
}

export function formatMatrix(m: number[][]): string {
  return m.map((row) => row.map((v) => String(v).padStart(3, ' ')).join(' ')).join('\n');
}
