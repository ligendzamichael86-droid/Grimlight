// P0.b — Farb-Bibliothek (deterministisch, keine Zufallsquelle, keine Zeit).
// Formeln identisch zu .tmp/gp7ch_review/color.mjs (Pruefer-Referenz), damit die
// Zahlen des Reviews (M12: G Hue 5,2 / C*ab 30,3; dE00(G,X)=16,1) reproduziert werden.

export const rgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];
export const hex = (r, g, b) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

// Rec.601-Luma auf 0..255 — die im Projekt durchgaengig benutzte "L"-Groesse
// (palette.js-Kopf, dl_band.mjs, SPEC E1-Baender).
export const L601 = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
export const L601hex = (h) => L601(...rgb(h));

const LIN = new Float64Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  LIN[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
const fLab = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

export function labRGB(r, g, b) {
  const R = LIN[r], G = LIN[g], B = LIN[b];
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const fx = fLab(X), fy = fLab(Y), fz = fLab(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
export const lab = (h) => labRGB(...rgb(h));
export const Cab = (l) => Math.hypot(l[1], l[2]);
export const hueAb = (l) => (Math.atan2(l[2], l[1]) * 180 / Math.PI + 360) % 360;

export function dE00lab(l1, l2) {
  const [L1, a1, b1] = l1, [L2, a2, b2] = l2;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const Cb7 = Math.pow(Cb, 7);
  const G = 0.5 * (1 - Math.sqrt(Cb7 / (Cb7 + 6103515625))); // 25^7
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1p = (Math.atan2(b1, a1p) * 180 / Math.PI + 360) % 360;
  const h2p = (Math.atan2(b2, a2p) * 180 / Math.PI + 360) % 360;
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; if (dhp < -180) dhp += 360; }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp;
  if (C1p * C2p === 0) hbp = h1p + h2p;
  else { hbp = (h1p + h2p) / 2; if (Math.abs(h1p - h2p) > 180) hbp += (h1p + h2p < 360) ? 180 : -180; }
  const T = 1 - 0.17 * Math.cos((hbp - 30) * Math.PI / 180)
            + 0.24 * Math.cos(2 * hbp * Math.PI / 180)
            + 0.32 * Math.cos((3 * hbp + 6) * Math.PI / 180)
            - 0.20 * Math.cos((4 * hbp - 63) * Math.PI / 180);
  const dTh = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
  const Cbp7 = Math.pow(Cbp, 7);
  const Rc = 2 * Math.sqrt(Cbp7 / (Cbp7 + 6103515625));
  const Sl = 1 + 0.015 * Math.pow(Lbp - 50, 2) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
  const Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTh * Math.PI / 180) * Rc;
  return Math.sqrt(Math.pow(dLp / Sl, 2) + Math.pow(dCp / Sc, 2) + Math.pow(dHp / Sh, 2)
                   + Rt * (dCp / Sc) * (dHp / Sh));
}
export const dE00 = (h1, h2) => dE00lab(lab(h1), lab(h2));

// zyklische Hue-Differenz, Ergebnis in (-180, 180]
export function dHue(a, b) { let d = a - b; while (d > 180) d -= 360; while (d <= -180) d += 360; return d; }
export const inHueFenster = (h, lo, hi) => {
  // Fenster darf ueber 0 Grad laufen (lo > hi)
  return lo <= hi ? (h >= lo && h <= hi) : (h >= lo || h <= hi);
};
export const r3 = (x) => Math.round(x * 1000) / 1000;
export const r2 = (x) => Math.round(x * 100) / 100;
