import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { StoreTemplate } from "@/components/store-templates";

const SlugInput = z.object({ slug: z.string().min(1) });

const getPublicStore = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => SlugInput.parse(data))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Configuração do backend ausente no servidor.");
    const supa = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: store, error } = await supa
      .from("stores")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();

    if (error) throw error;
    if (!store) return null;

    const { data: vehicles } = await supa
      .from("vehicles")
      .select("id,title,brand,model,year,km,price,photos,featured,fuel,color")
      .eq("store_id", store.id)
      .eq("sold", false)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(48);

    return { store, vehicles: vehicles ?? [] };
  });

export const Route = createFileRoute("/loja/$slug")({
  loader: async ({ params }) => {
    const result = await getPublicStore({ data: { slug: params.slug } });
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Loja não encontrada" }] };
    const s = loaderData.store as any;
    const title = `${s.name} — Seminovos selecionados`;
    const description = s.tagline ?? s.hero_subheadline ?? `Confira o estoque da ${s.name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        ...(s.logo_url ? [{ property: "og:image", content: s.logo_url }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PublicStore,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center">Erro ao carregar: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-background p-10 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold">Loja não encontrada</h1>
        <p className="mt-2 text-muted-foreground">Essa revenda ainda não publicou seu site.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-primary px-5 py-2 text-primary-foreground">Voltar ao início</Link>
      </div>
    </div>
  ),
});

function PublicStore() {
  const { store, vehicles } = Route.useLoaderData() as { store: any; vehicles: any[] };
  return <StoreTemplate store={store} vehicles={vehicles} />;
}
