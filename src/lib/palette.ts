// Client-side palette extraction from a logo image using canvas.
// Simple color quantization: buckets colors, picks dominant + accent + neutral.

export type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  style: "elegante" | "corporativo" | "esportivo" | "premium" | "moderno";
};

export async function extractPaletteFromFile(file: File): Promise<Palette> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;

    const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 200) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Skip near-white/near-black to catch brand colors
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const lightness = (max + min) / 2;
      const saturation = max === min ? 0 : (max - min) / (255 - Math.abs(2 * lightness - 255) || 1);
      // Quantize
      const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
      const entry = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
      entry.r += r; entry.g += g; entry.b += b; entry.count += 1;
      // Weight saturated pixels more
      if (saturation > 0.3 && lightness > 30 && lightness < 230) entry.count += 3;
      buckets.set(key, entry);
    }

    const sorted = [...buckets.values()]
      .map((e) => ({ r: e.r / e.count, g: e.g / e.count, b: e.b / e.count, count: e.count }))
      .sort((a, b) => b.count - a.count);

    const primary = pickColorful(sorted) ?? sorted[0];
    const secondary = pickDistinct(sorted, primary) ?? shift(primary, 30);
    const accent = complement(primary);
    const neutral = sorted.find((c) => isNeutral(c)) ?? { r: 20, g: 20, b: 24, count: 1 };

    return {
      primary: rgb(primary),
      secondary: rgb(secondary),
      accent: rgb(accent),
      neutral: rgb(neutral),
      style: classifyStyle(primary),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

type RGB = { r: number; g: number; b: number; count?: number };

function pickColorful(list: RGB[]): RGB | undefined {
  return list.find((c) => {
    const max = Math.max(c.r, c.g, c.b), min = Math.min(c.r, c.g, c.b);
    return max - min > 40 && max < 240 && min > 10;
  });
}
function pickDistinct(list: RGB[], from: RGB): RGB | undefined {
  return list.find((c) => Math.hypot(c.r - from.r, c.g - from.g, c.b - from.b) > 80);
}
function isNeutral(c: RGB): boolean {
  const max = Math.max(c.r, c.g, c.b), min = Math.min(c.r, c.g, c.b);
  return max - min < 15;
}
function complement(c: RGB): RGB {
  return { r: 255 - c.r, g: 255 - c.g, b: 255 - c.b };
}
function shift(c: RGB, amt: number): RGB {
  return { r: clamp(c.r + amt), g: clamp(c.g + amt), b: clamp(c.b + amt) };
}
function clamp(n: number) { return Math.max(0, Math.min(255, Math.round(n))); }
function rgb(c: RGB): string {
  const to = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${to(c.r)}${to(c.g)}${to(c.b)}`;
}
function classifyStyle(c: RGB): Palette["style"] {
  const { r, g, b } = c;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max - min < 20) return max < 80 ? "elegante" : "moderno";
  if (r > g && r > b) return "esportivo";
  if (b > r && b > g) return "corporativo";
  if (g > r && g > b) return "premium";
  return "moderno";
}
