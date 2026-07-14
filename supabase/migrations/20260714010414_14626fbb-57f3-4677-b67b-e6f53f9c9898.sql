
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS hero_headline TEXT,
  ADD COLUMN IF NOT EXISTS hero_subheadline TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS about_text TEXT,
  ADD COLUMN IF NOT EXISTS cta_text TEXT;

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year INTEGER,
  km INTEGER,
  price NUMERIC(12,2),
  fuel TEXT,
  transmission TEXT,
  color TEXT,
  description TEXT,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured BOOLEAN NOT NULL DEFAULT false,
  sold BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT ON public.vehicles TO anon;
GRANT ALL ON public.vehicles TO service_role;

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manage vehicles" ON public.vehicles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

CREATE POLICY "public read vehicles of published stores" ON public.vehicles FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.published = true) AND sold = false);

CREATE POLICY "auth read vehicles of published stores" ON public.vehicles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND (s.owner_id = auth.uid() OR s.published = true)));

CREATE TRIGGER set_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS vehicles_store_idx ON public.vehicles(store_id);
