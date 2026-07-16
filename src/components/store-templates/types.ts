import { useMemo, useState } from "react";

export type TemplateId = "premium-dark" | "editorial-minimal" | "sport-bold" | "classic-luxury";

export type StoreLike = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  about_text: string | null;
  cta_text: string | null;
  style_tag: string | null;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  neutral_color: string | null;
  font_display: string | null;
  template?: string | null;
};

export type VehicleLike = {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  km: number | null;
  price: number | string | null;
  photos: unknown;
  featured?: boolean | null;
  fuel?: string | null;
  color?: string | null;
};

export type TemplateMeta = {
  id: TemplateId;
  label: string;
  tagline: string;
  description: string;
  vibe: string;
};

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "premium-dark",
    label: "Premium Dark",
    tagline: "Showroom noturno",
    description: "Fundo escuro, tipografia display marcante e acentos dourados. Vibe luxo e presença.",
    vibe: "dark",
  },
  {
    id: "editorial-minimal",
    label: "Editorial Minimal",
    tagline: "Concessionária europeia",
    description: "Branco refinado, serif elegante, muito respiro. Vibe minimal premium.",
    vibe: "light",
  },
  {
    id: "sport-bold",
    label: "Sport Bold",
    tagline: "Performance & adrenalina",
    description: "Contrastes fortes, diagonais, tipografia condensada. Vibe esportivo/pista.",
    vibe: "dark",
  },
  {
    id: "classic-luxury",
    label: "Classic Luxury",
    tagline: "Tradição consolidada",
    description: "Navy, dourado e creme com serifas clássicas. Vibe tradicional e confiável.",
    vibe: "light",
  },
];

export function normalizeTemplate(v: unknown): TemplateId {
  const id = String(v ?? "").toLowerCase();
  const found = TEMPLATES.find((t) => t.id === id);
  return found?.id ?? "premium-dark";
}

export function firstPhoto(v: VehicleLike): string | null {
  const arr = Array.isArray(v.photos) ? (v.photos as unknown[]) : null;
  return arr && typeof arr[0] === "string" ? (arr[0] as string) : null;
}

export function heroPhotoFrom(vehicles: VehicleLike[]): string | null {
  const featured = vehicles.find((v) => v.featured && firstPhoto(v));
  if (featured) return firstPhoto(featured);
  const any = vehicles.find((v) => firstPhoto(v));
  return any ? firstPhoto(any) : null;
}

export function useStockFilters(vehicles: VehicleLike[]) {
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [fuel, setFuel] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const brands = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.brand).filter(Boolean))).sort() as string[],
    [vehicles],
  );
  const fuels = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.fuel).filter(Boolean))).sort() as string[],
    [vehicles],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const minY = minYear ? parseInt(minYear, 10) : null;
    const maxY = maxYear ? parseInt(maxYear, 10) : null;
    const minP = minPrice ? parseFloat(minPrice.replace(/\./g, "").replace(",", ".")) : null;
    const maxP = maxPrice ? parseFloat(maxPrice.replace(/\./g, "").replace(",", ".")) : null;

    return vehicles.filter((v) => {
      if (term) {
        const hay = [v.title, v.brand, v.model, v.color].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (brand && v.brand !== brand) return false;
      if (fuel && v.fuel !== fuel) return false;
      if (minY != null && (v.year == null || v.year < minY)) return false;
      if (maxY != null && (v.year == null || v.year > maxY)) return false;
      if (minP != null && (v.price == null || Number(v.price) < minP)) return false;
      if (maxP != null && (v.price == null || Number(v.price) > maxP)) return false;
      return true;
    });
  }, [vehicles, q, brand, fuel, minYear, maxYear, minPrice, maxPrice]);

  const anyActive = !!(q || brand || fuel || minYear || maxYear || minPrice || maxPrice);
  const clear = () => {
    setQ(""); setBrand(""); setFuel(""); setMinYear(""); setMaxYear(""); setMinPrice(""); setMaxPrice("");
  };

  return {
    state: { q, brand, fuel, minYear, maxYear, minPrice, maxPrice },
    set: { setQ, setBrand, setFuel, setMinYear, setMaxYear, setMinPrice, setMaxPrice },
    brands, fuels, filtered, anyActive, clear,
  };
}

export function formatBRL(v: number | string | null | undefined): string | null {
  if (v == null) return null;
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return null;
  return `R$ ${n.toLocaleString("pt-BR")}`;
}
