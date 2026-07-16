import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Shield, Users, Store as StoreIcon, Car, LogOut, ExternalLink, Search,
  CheckCircle2, XCircle, Loader2, TrendingUp, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Administração — AutoSite" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) throw redirect({ to: "/auth" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

type AdminStore = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  owner_id: string;
  published: boolean;
  city: string | null;
  state: string | null;
  phone: string | null;
  whatsapp: string | null;
  logo_url: string | null;
  created_at: string;
};

type OwnerProfile = { id: string; full_name: string | null };
type AuditRow = {
  id: string; entity: string; action: string; summary: string | null;
  actor_name: string | null; created_at: string; store_id: string;
};

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [owners, setOwners] = useState<Record<string, OwnerProfile>>({});
  const [counts, setCounts] = useState<Record<string, { total: number; sold: number }>>({});
  const [recent, setRecent] = useState<AuditRow[]>([]);
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "start" | "pro" | "premium">("all");
  const [pubFilter, setPubFilter] = useState<"all" | "pub" | "unpub">("all");
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      setEmail(userRes.user?.email ?? "");

      const [storesRes, vehiclesRes, auditRes] = await Promise.all([
        supabase.from("stores").select("*").order("created_at", { ascending: false }),
        supabase.from("vehicles").select("store_id,sold"),
        supabase.from("audit_logs").select("id,entity,action,summary,actor_name,created_at,store_id")
          .order("created_at", { ascending: false }).limit(30),
      ]);

      if (storesRes.error) toast.error(storesRes.error.message);
      const s = (storesRes.data as AdminStore[]) ?? [];
      setStores(s);

      const ownerIds = Array.from(new Set(s.map((x) => x.owner_id)));
      if (ownerIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", ownerIds);
        const map: Record<string, OwnerProfile> = {};
        (profs ?? []).forEach((p) => { map[p.id] = p as OwnerProfile; });
        setOwners(map);
      }

      const cmap: Record<string, { total: number; sold: number }> = {};
      ((vehiclesRes.data as { store_id: string; sold: boolean }[]) ?? []).forEach((v) => {
        cmap[v.store_id] ??= { total: 0, sold: 0 };
        cmap[v.store_id].total++;
        if (v.sold) cmap[v.store_id].sold++;
      });
      setCounts(cmap);

      setRecent((auditRes.data as AuditRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return stores.filter((s) => {
      if (planFilter !== "all" && s.plan !== planFilter) return false;
      if (pubFilter === "pub" && !s.published) return false;
      if (pubFilter === "unpub" && s.published) return false;
      if (!term) return true;
      const owner = owners[s.owner_id]?.full_name ?? "";
      return [s.name, s.slug, s.city, s.state, owner]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term));
    });
  }, [stores, owners, q, planFilter, pubFilter]);

  const totals = useMemo(() => {
    const totalVehicles = Object.values(counts).reduce((a, b) => a + b.total, 0);
    const sold = Object.values(counts).reduce((a, b) => a + b.sold, 0);
    const published = stores.filter((s) => s.published).length;
    return { stores: stores.length, published, totalVehicles, sold, owners: Object.keys(owners).length };
  }, [stores, counts, owners]);

  const togglePublish = async (s: AdminStore) => {
    const next = !s.published;
    const { error } = await supabase.from("stores").update({ published: next }).eq("id", s.id);
    if (error) return toast.error(error.message);
    setStores((prev) => prev.map((x) => (x.id === s.id ? { ...x, published: next } : x)));
    toast.success(next ? "Publicado" : "Despublicado");
  };

  const deleteStore = async (s: AdminStore) => {
    if (!confirm(`Excluir a loja "${s.name}"? Esta ação é permanente.`)) return;
    const { error } = await supabase.from("stores").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    setStores((prev) => prev.filter((x) => x.id !== s.id));
    toast.success("Loja excluída");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display text-lg font-bold">AutoSite Admin</span>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Painel do proprietário</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:inline">{email}</span>
            <Link to="/dashboard" className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-surface">
              Minhas lojas
            </Link>
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-surface">
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <h1 className="font-display text-3xl font-bold">Todos os clientes</h1>
          <p className="mt-1 text-muted-foreground">Visão consolidada de lojas, veículos e atividade recente.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Kpi icon={<StoreIcon className="h-4 w-4" />} label="Lojas" value={totals.stores} />
          <Kpi icon={<CheckCircle2 className="h-4 w-4" />} label="Publicadas" value={totals.published} tone="success" />
          <Kpi icon={<Users className="h-4 w-4" />} label="Proprietários" value={totals.owners} />
          <Kpi icon={<Car className="h-4 w-4" />} label="Veículos" value={totals.totalVehicles} />
          <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Vendidos" value={totals.sold} tone="info" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por loja, slug, cidade ou dono…"
                  className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as typeof planFilter)}
                className="rounded-full border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">Todos os planos</option>
                <option value="start">Start</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
              <select
                value={pubFilter}
                onChange={(e) => setPubFilter(e.target.value as typeof pubFilter)}
                className="rounded-full border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">Todos</option>
                <option value="pub">Publicadas</option>
                <option value="unpub">Rascunhos</option>
              </select>
            </div>

            <div className="mt-4 overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando…
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">Nenhuma loja encontrada.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="pb-3">Loja</th>
                      <th className="pb-3">Proprietário</th>
                      <th className="pb-3">Plano</th>
                      <th className="pb-3">Veículos</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => {
                      const c = counts[s.id] ?? { total: 0, sold: 0 };
                      const owner = owners[s.owner_id];
                      return (
                        <tr key={s.id} className="border-t border-border">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              {s.logo_url ? (
                                <img src={s.logo_url} alt="" className="h-8 w-8 rounded-md bg-white object-contain p-1" />
                              ) : (
                                <div className="grid h-8 w-8 place-items-center rounded-md bg-muted">
                                  <Car className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold">{s.name}</p>
                                <p className="font-mono text-[11px] text-muted-foreground">
                                  {s.slug}{s.city ? ` · ${s.city}/${s.state ?? ""}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {owner?.full_name ?? <span className="text-xs">—</span>}
                          </td>
                          <td className="py-3">
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                              {s.plan}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="font-mono">{c.total}</span>
                            <span className="ml-1 text-[11px] text-muted-foreground">({c.sold} vend.)</span>
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => togglePublish(s)}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                s.published
                                  ? "bg-success/15 text-success hover:bg-success/25"
                                  : "bg-muted text-muted-foreground hover:bg-muted/70"
                              }`}
                            >
                              {s.published ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              {s.published ? "Publicada" : "Rascunho"}
                            </button>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to="/gerenciar/$id"
                                params={{ id: s.id }}
                                className="rounded-full border border-border px-2.5 py-1 text-[11px] hover:bg-surface"
                              >
                                Gerenciar
                              </Link>
                              <Link
                                to="/loja/$slug"
                                params={{ slug: s.slug }}
                                target="_blank"
                                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] hover:bg-surface"
                              >
                                Site <ExternalLink className="h-3 w-3" />
                              </Link>
                              <button
                                onClick={() => deleteStore(s)}
                                className="rounded-full border border-destructive/40 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10"
                                title="Excluir loja"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <aside className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-bold">Atividade recente</h2>
            <p className="text-xs text-muted-foreground">Últimas alterações em todas as lojas</p>
            <ul className="mt-4 space-y-3 text-sm">
              {loading ? (
                <li className="text-muted-foreground">Carregando…</li>
              ) : recent.length === 0 ? (
                <li className="text-muted-foreground">Nenhuma atividade ainda.</li>
              ) : (
                recent.map((r) => (
                  <li key={r.id} className="border-b border-border/60 pb-2 last:border-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-BR")} · {r.actor_name ?? "sistema"}
                    </p>
                    <p className="text-sm">{r.summary ?? `${r.entity} ${r.action}`}</p>
                  </li>
                ))
              )}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: "success" | "info" }) {
  const toneCls = tone === "success" ? "text-success" : tone === "info" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground`}>
        <span className={toneCls}>{icon}</span> {label}
      </div>
      <p className={`mt-1 font-display text-2xl font-bold ${toneCls}`}>{value}</p>
    </div>
  );
}
