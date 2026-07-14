import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Car, ExternalLink, Loader2, Plus, Save, Trash2, Upload, X, Star, CheckCircle2,
  History, FileUp, Download, GripVertical,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];
type AuditRow = {
  id: string;
  store_id: string;
  entity: string;
  entity_id: string;
  action: string;
  actor_id: string | null;
  actor_name: string | null;
  summary: string | null;
  changes: Record<string, { from: unknown; to: unknown }>;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/gerenciar/$id")({
  head: () => ({
    meta: [{ title: "Gerenciar loja — AutoSite" }, { name: "robots", content: "noindex" }],
  }),
  component: Manage,
});

const FUELS = ["Flex", "Gasolina", "Diesel", "Etanol", "Híbrido", "Elétrico"] as const;
const TRANSMISSIONS = ["Automático", "Manual", "CVT", "Automatizado"] as const;

function Manage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreRow | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [tab, setTab] = useState<"info" | "textos" | "veiculos" | "historico">("info");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s, error: sErr } = await supabase.from("stores").select("*").eq("id", id).maybeSingle();
      if (sErr || !s) {
        toast.error(sErr?.message || "Loja não encontrada");
        navigate({ to: "/dashboard" });
        return;
      }
      setStore(s);
      const { data: vs } = await supabase.from("vehicles").select("*").eq("store_id", id).order("created_at", { ascending: false });
      setVehicles((vs as VehicleRow[]) ?? []);
      setLoading(false);
    })();
  }, [id, navigate]);

  const reloadVehicles = async () => {
    const { data: vs } = await supabase.from("vehicles").select("*").eq("store_id", id).order("created_at", { ascending: false });
    setVehicles((vs as VehicleRow[]) ?? []);
  };

  const saveStore = async (patch: Partial<StoreRow>): Promise<void> => {
    if (!store) return;
    setSavingStore(true);
    const { data, error } = await supabase.from("stores").update(patch).eq("id", store.id).select("*").maybeSingle();
    setSavingStore(false);
    if (error) { toast.error(error.message); return; }
    if (data) setStore(data as StoreRow);
    toast.success("Alterações salvas");
  };

  const togglePublish = async () => {
    if (!store) return;
    setPublishing(true);
    const next = !store.published;
    const { error } = await supabase.from("stores").update({ published: next }).eq("id", store.id);
    setPublishing(false);
    if (error) return toast.error(error.message);
    setStore({ ...store, published: next });
    toast.success(next ? "Site publicado!" : "Site despublicado");
  };

  const onVehicleSaved = (v: VehicleRow, isNew: boolean) => {
    setVehicles((prev) => isNew ? [v, ...prev] : prev.map((x) => x.id === v.id ? v : x));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", deleteTarget.id);
    if (error) return toast.error(error.message);
    setVehicles((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Veículo removido");
  };

  if (loading || !store) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Carregando…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao painel
          </Link>
          <div className="flex items-center gap-3">
            <a
              href={`/loja/${store.slug}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Abrir site <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={togglePublish}
              disabled={publishing}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                store.published
                  ? "bg-success/15 text-success hover:bg-success/25"
                  : "bg-gradient-primary text-primary-foreground hover:brightness-110"
              }`}
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <span className={`h-2 w-2 rounded-full ${store.published ? "bg-success" : "bg-primary-foreground"}`} />
              )}
              {store.published ? "Publicado" : "Publicar site"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{store.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{store.slug}.autosite.com.br · Plano {store.plan}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-1 border-b border-border overflow-x-auto">
          {([
            ["info", "Informações"],
            ["textos", "Textos"],
            ["veiculos", `Veículos (${vehicles.length})`],
            ["historico", "Histórico"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === k ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "info" && <InfoTab store={store} onSave={saveStore} saving={savingStore} />}
          {tab === "textos" && <CopyTab store={store} onSave={saveStore} saving={savingStore} />}
          {tab === "veiculos" && (
            <VehiclesTab
              vehicles={vehicles}
              onAdd={() => { setEditing(null); setDialogOpen(true); }}
              onEdit={(v) => { setEditing(v); setDialogOpen(true); }}
              onDelete={(v) => setDeleteTarget(v)}
              onImport={() => setImportOpen(true)}
            />
          )}
          {tab === "historico" && <HistoryTab storeId={store.id} />}
        </div>
      </main>

      {dialogOpen && (
        <VehicleDialog
          storeId={store.id}
          existing={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={onVehicleSaved}
        />
      )}

      {importOpen && (
        <ImportCsvDialog
          storeId={store.id}
          onClose={() => setImportOpen(false)}
          onDone={async () => { setImportOpen(false); await reloadVehicles(); }}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este veículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O veículo será excluído permanentemente do seu estoque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------------- INFO TAB ---------------- */
function InfoTab({ store, onSave, saving }: { store: StoreRow; onSave: (p: Partial<StoreRow>) => Promise<void>; saving: boolean }) {
  const [name, setName] = useState(store.name);
  const [phone, setPhone] = useState(store.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(store.whatsapp ?? "");
  const [address, setAddress] = useState(store.address ?? "");
  const [city, setCity] = useState(store.city ?? "");
  const [stateUf, setStateUf] = useState(store.state ?? "");

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-bold">Informações da loja</h2>
      <p className="mt-1 text-sm text-muted-foreground">Dados de contato exibidos no site público.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Nome da loja"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Telefone"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 3000-0000" /></Field>
        <Field label="WhatsApp"><input className={inputCls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 90000-0000" /></Field>
        <Field label="Endereço" className="md:col-span-2"><input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
        <Field label="Cidade"><input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} /></Field>
        <Field label="Estado"><input className={inputCls} value={stateUf} onChange={(e) => setStateUf(e.target.value)} placeholder="SP" maxLength={2} /></Field>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => onSave({ name, phone, whatsapp, address, city, state: stateUf })}
          disabled={saving || !name.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:brightness-110 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
        </button>
      </div>
    </div>
  );
}

/* ---------------- COPY TAB ---------------- */
function CopyTab({ store, onSave, saving }: { store: StoreRow; onSave: (p: Partial<StoreRow>) => Promise<void>; saving: boolean }) {
  const [hero, setHero] = useState(store.hero_headline ?? "");
  const [sub, setSub] = useState(store.hero_subheadline ?? "");
  const [tag, setTag] = useState(store.tagline ?? "");
  const [about, setAbout] = useState(store.about_text ?? "");
  const [cta, setCta] = useState(store.cta_text ?? "");

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-bold">Textos do site</h2>
      <p className="mt-1 text-sm text-muted-foreground">Edite os textos gerados pela IA a qualquer momento.</p>

      <div className="mt-6 space-y-4">
        <Field label="Título principal (hero)"><input className={inputCls} value={hero} onChange={(e) => setHero(e.target.value)} maxLength={80} /></Field>
        <Field label="Subtítulo"><textarea className={inputCls} rows={2} value={sub} onChange={(e) => setSub(e.target.value)} maxLength={200} /></Field>
        <Field label="Slogan"><input className={inputCls} value={tag} onChange={(e) => setTag(e.target.value)} maxLength={60} /></Field>
        <Field label="Texto sobre a loja"><textarea className={inputCls} rows={5} value={about} onChange={(e) => setAbout(e.target.value)} maxLength={600} /></Field>
        <Field label="Texto do botão principal (CTA)"><input className={inputCls} value={cta} onChange={(e) => setCta(e.target.value)} maxLength={30} /></Field>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => onSave({ hero_headline: hero, hero_subheadline: sub, tagline: tag, about_text: about, cta_text: cta })}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:brightness-110 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar textos
        </button>
      </div>
    </div>
  );
}

/* ---------------- VEHICLES TAB ---------------- */
function VehiclesTab({
  vehicles, onAdd, onEdit, onDelete, onImport,
}: {
  vehicles: VehicleRow[];
  onAdd: () => void;
  onEdit: (v: VehicleRow) => void;
  onDelete: (v: VehicleRow) => void;
  onImport: () => void;
}) {
  const exportCsv = () => {
    if (vehicles.length === 0) {
      toast.info("Nenhum veículo para exportar.");
      return;
    }
    const csv = buildVehiclesCsv(vehicles);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `veiculos-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${vehicles.length} veículo(s) exportado(s)`);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Estoque de veículos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre e gerencie os carros exibidos no seu site.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface/70"
            title="Baixar todos os veículos em CSV — edite e reimporte para atualizar em massa"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <button
            onClick={onImport}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface/70"
          >
            <FileUp className="h-4 w-4" /> Importar CSV
          </button>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Novo veículo
          </button>
        </div>
      </div>


      {vehicles.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-surface/30 p-10 text-center">
          <Car className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Nenhum veículo cadastrado</p>
          <p className="mt-1 text-sm text-muted-foreground">Clique em "Novo veículo" ou "Importar CSV" para começar seu estoque.</p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border">
          {vehicles.map((v) => {
            const photo = Array.isArray(v.photos) && v.photos.length > 0 ? String(v.photos[0]) : null;
            return (
              <div key={v.id} className="flex items-center gap-4 py-4">
                <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  {photo ? (
                    <img src={photo} alt={v.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground"><Car className="h-6 w-6" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{v.title}</p>
                    {v.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                        <Star className="h-3 w-3" /> Destaque
                      </span>
                    )}
                    {v.sold && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Vendido</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {[v.brand, v.model, v.year, v.km ? `${Number(v.km).toLocaleString("pt-BR")} km` : null].filter(Boolean).join(" • ")}
                  </p>
                </div>
                <div className="text-right">
                  {v.price != null && (
                    <p className="font-display text-lg font-bold text-primary">
                      R$ {Number(v.price).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onEdit(v)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface">Editar</button>
                  <button onClick={() => onDelete(v)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-destructive hover:text-destructive" title="Remover">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- HISTORY TAB ---------------- */
function HistoryTab({ storeId }: { storeId: string }) {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [filter, setFilter] = useState<"all" | "store" | "vehicle">("all");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("audit_logs" as never)
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) { toast.error(error.message); setRows([]); return; }
      setRows((data as unknown as AuditRow[]) ?? []);
    })();
  }, [storeId]);

  const filtered = useMemo(
    () => (rows ?? []).filter((r) => filter === "all" || r.entity === filter),
    [rows, filter]
  );

  const actionLabel = (a: string) =>
    a === "created" ? "Criado" : a === "updated" ? "Atualizado" : a === "deleted" ? "Removido" : a;
  const actionColor = (a: string) =>
    a === "created" ? "bg-success/15 text-success" :
    a === "deleted" ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary";

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <History className="h-5 w-5" /> Histórico de alterações
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Registros das últimas 200 mudanças (quem alterou e quando).</p>
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-surface p-1 text-xs">
          {(["all","store","vehicle"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-full px-3 py-1.5 font-medium ${filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {k === "all" ? "Tudo" : k === "store" ? "Loja" : "Veículos"}
            </button>
          ))}
        </div>
      </div>

      {rows === null ? (
        <div className="mt-6 flex justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-surface/30 p-10 text-center text-sm text-muted-foreground">
          Nenhum registro ainda.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {filtered.map((r) => {
            const date = new Date(r.created_at);
            const changeKeys = r.changes ? Object.keys(r.changes) : [];
            return (
              <li key={r.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${actionColor(r.action)}`}>
                    {actionLabel(r.action)}
                  </span>
                  <span className="font-medium">{r.summary ?? `${r.entity} ${r.action}`}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {r.actor_name ?? "Sistema"} · {date.toLocaleString("pt-BR")}
                  </span>
                </div>
                {r.action === "updated" && changeKeys.length > 0 && (
                  <details className="mt-1.5 text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Ver {changeKeys.length} alteração(ões)</summary>
                    <ul className="mt-2 space-y-1 rounded-lg bg-surface/40 p-3 font-mono">
                      {changeKeys.slice(0, 12).map((k) => (
                        <li key={k}>
                          <span className="font-semibold text-foreground">{k}:</span>{" "}
                          <span className="text-destructive line-through">{fmtVal(r.changes[k]?.from)}</span>{" → "}
                          <span className="text-success">{fmtVal(r.changes[k]?.to)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function fmtVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v.length > 60 ? v.slice(0, 60) + "…" : v;
  if (typeof v === "object") return JSON.stringify(v).slice(0, 60);
  return String(v);
}

/* ---------------- CSV IMPORT DIALOG ---------------- */
const CSV_TEMPLATE =
  "title,brand,model,year,km,price,fuel,transmission,color,description,featured,sold\n" +
  "Honda Civic EXL 2020 Automático,Honda,Civic,2020,45000,99900,Flex,Automático,Preto,Único dono,true,false\n";

const CSV_COLUMNS = ["title","brand","model","year","km","price","fuel","transmission","color","description","featured","sold"] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildVehiclesCsv(rows: VehicleRow[]): string {
  const header = CSV_COLUMNS.join(",");
  const body = rows.map((v) =>
    CSV_COLUMNS.map((col) => csvEscape((v as unknown as Record<string, unknown>)[col])).join(",")
  ).join("\n");
  return header + "\n" + body + "\n";
}



function ImportCsvDialog({
  storeId, onClose, onDone,
}: { storeId: string; onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [stats, setStats] = useState<{ total: number; valid: number; toInsert: number; toUpdate: number; invalid: number } | null>(null);

  const parseFile = async (f: File) => {
    setFile(f);
    setErrors([]);
    setStats(null);
    setPreview([]);
    setAnalyzing(true);
    try {
      const text = await f.text();
      const rows = parseCsv(text);
      if (rows.length === 0) { setErrors(["Arquivo vazio."]); return; }
      const errs: string[] = [];
      const validTitles: string[] = [];
      rows.forEach((r, i) => {
        if (!r.title || !r.title.trim()) errs.push(`Linha ${i + 2}: título vazio`);
        else validTitles.push(r.title.trim());
      });
      setErrors(errs);
      setPreview(rows.slice(0, 50));

      let existingSet = new Set<string>();
      if (validTitles.length > 0) {
        const { data: existing } = await supabase
          .from("vehicles").select("title").eq("store_id", storeId).in("title", validTitles);
        existingSet = new Set((existing ?? []).map((e) => e.title));
      }
      const uniqueValid = Array.from(new Set(validTitles));
      const toUpdate = uniqueValid.filter((t) => existingSet.has(t)).length;
      const toInsert = uniqueValid.length - toUpdate;
      setStats({
        total: rows.length,
        valid: validTitles.length,
        toInsert,
        toUpdate,
        invalid: errs.length,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const doImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const payload = rows
        .filter((r) => r.title && r.title.trim())
        .map((r) => ({
          store_id: storeId,
          title: r.title.trim(),
          brand: r.brand?.trim() || null,
          model: r.model?.trim() || null,
          year: r.year ? parseInt(String(r.year).replace(/\D/g, ""), 10) || null : null,
          km: r.km ? parseInt(String(r.km).replace(/\D/g, ""), 10) || null : null,
          price: r.price ? parseFloat(String(r.price).replace(/\./g, "").replace(",", ".")) || null : null,
          fuel: r.fuel?.trim() || null,
          transmission: r.transmission?.trim() || null,
          color: r.color?.trim() || null,
          description: r.description?.trim() || null,
          featured: parseBool(r.featured),
          sold: parseBool(r.sold),
          photos: [] as unknown as Database["public"]["Tables"]["vehicles"]["Insert"]["photos"],
        }));

      if (payload.length === 0) { toast.error("Nenhuma linha válida."); return; }

      // Upsert-by-title strategy: fetch existing titles for this store and update, insert the rest.
      const titles = payload.map((p) => p.title);
      const { data: existing } = await supabase
        .from("vehicles").select("id,title").eq("store_id", storeId).in("title", titles);
      const map = new Map((existing ?? []).map((e) => [e.title, e.id]));

      let inserted = 0, updated = 0;
      for (const p of payload) {
        const id = map.get(p.title);
        if (id) {
          const { error } = await supabase.from("vehicles").update(p).eq("id", id);
          if (error) throw error;
          updated++;
        } else {
          const { error } = await supabase.from("vehicles").insert(p);
          if (error) throw error;
          inserted++;
        }
      }
      toast.success(`Importação concluída: ${inserted} novo(s), ${updated} atualizado(s)`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao importar CSV");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "modelo-veiculos.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar veículos via CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface/40 p-4 text-sm">
            <p className="font-semibold">Colunas aceitas</p>
            <p className="mt-1 text-xs text-muted-foreground">
              <code>title, brand, model, year, km, price, fuel, transmission, color, description, featured, sold</code>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Linhas com o mesmo <b>title</b> de um veículo existente serão atualizadas; as demais serão adicionadas.
              Fotos devem ser adicionadas depois, editando cada veículo.
            </p>
            <button onClick={downloadTemplate} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline">
              <Download className="h-3.5 w-3.5" /> Baixar modelo de CSV
            </button>
          </div>

          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => e.target.files && e.target.files[0] && parseFile(e.target.files[0])}
            className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
          />

          {analyzing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analisando arquivo…
            </div>
          )}

          {stats && !analyzing && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatCard label="Linhas no arquivo" value={stats.total} />
              <StatCard label="Serão inseridas" value={stats.toInsert} tone="success" />
              <StatCard label="Serão atualizadas" value={stats.toUpdate} tone="info" />
              <StatCard label="Ignoradas (inválidas)" value={stats.invalid} tone={stats.invalid > 0 ? "warn" : undefined} />
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              {errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
              {errors.length > 5 && <div>… e mais {errors.length - 5} erro(s)</div>}
            </div>
          )}

          {preview.length > 0 && (
            <div className="max-h-64 overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-surface text-left">
                  <tr>
                    <th className="p-2">Título</th><th className="p-2">Marca</th><th className="p-2">Modelo</th>
                    <th className="p-2">Ano</th><th className="p-2">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2">{r.title}</td>
                      <td className="p-2">{r.brand}</td>
                      <td className="p-2">{r.model}</td>
                      <td className="p-2">{r.year}</td>
                      <td className="p-2">{r.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-border p-2 text-[11px] text-muted-foreground">
                Mostrando {preview.length} linha(s) de pré-visualização.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-surface">Cancelar</button>
          <button
            onClick={doImport}
            disabled={!file || importing || errors.length > 0}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-elegant hover:brightness-110 disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Importar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "success" | "info" | "warn" }) {
  const toneClass =
    tone === "success" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : tone === "info" ? "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400"
    : tone === "warn" ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
    : "border-border bg-surface/60 text-foreground";
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="text-[10px] font-medium uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );

function parseBool(v: unknown): boolean {
  const s = String(v ?? "").toLowerCase().trim();
  return s === "true" || s === "1" || s === "sim" || s === "yes" || s === "x";
}

/** Minimal CSV parser: quoted fields, escaped quotes, commas, CRLF. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).filter((r) => r.some((v) => v.trim() !== "")).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim(); });
    return obj;
  });
}

/* ---------------- VEHICLE DIALOG ---------------- */
function VehicleDialog({
  storeId, existing, onClose, onSaved,
}: {
  storeId: string;
  existing: VehicleRow | null;
  onClose: () => void;
  onSaved: (v: VehicleRow, isNew: boolean) => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [brand, setBrand] = useState(existing?.brand ?? "");
  const [model, setModel] = useState(existing?.model ?? "");
  const [year, setYear] = useState<string>(existing?.year?.toString() ?? "");
  const [km, setKm] = useState<string>(existing?.km?.toString() ?? "");
  const [price, setPrice] = useState<string>(existing?.price?.toString() ?? "");
  const [fuel, setFuel] = useState(existing?.fuel ?? "");
  const [transmission, setTransmission] = useState(existing?.transmission ?? "");
  const [color, setColor] = useState(existing?.color ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [featured, setFeatured] = useState(!!existing?.featured);
  const [sold, setSold] = useState(!!existing?.sold);
  const [photos, setPhotos] = useState<string[]>(
    Array.isArray(existing?.photos) ? (existing!.photos as unknown[]).map(String) : []
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadPhotos = async (files: FileList) => {
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Sessão expirada");
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${uid}/${storeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("vehicle-photos").upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        const { data: signed, error: sErr } = await supabase.storage.from("vehicle-photos").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
        if (sErr) throw sErr;
        uploaded.push(signed.signedUrl);
      }
      setPhotos((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} foto(s) enviada(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar fotos");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const movePhoto = (from: number, to: number) => {
    if (from === to) return;
    setPhotos((prev) => {
      const next = prev.slice();
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  };

  const save = async () => {
    if (!title.trim()) return toast.error("Informe o título do anúncio");
    setSaving(true);
    const payload = {
      store_id: storeId,
      title: title.trim(),
      brand: brand.trim() || null,
      model: model.trim() || null,
      year: year ? parseInt(year, 10) : null,
      km: km ? parseInt(km.replace(/\D/g, ""), 10) : null,
      price: price ? parseFloat(price.replace(/\./g, "").replace(",", ".")) : null,
      fuel: fuel || null,
      transmission: transmission || null,
      color: color.trim() || null,
      description: description.trim() || null,
      featured,
      sold,
      photos: photos as unknown as Database["public"]["Tables"]["vehicles"]["Insert"]["photos"],
    };
    if (existing) {
      const { data, error } = await supabase.from("vehicles").update(payload).eq("id", existing.id).select("*").maybeSingle();
      setSaving(false);
      if (error) return toast.error(error.message);
      if (data) { onSaved(data as VehicleRow, false); toast.success("Veículo atualizado"); onClose(); }
    } else {
      const { data, error } = await supabase.from("vehicles").insert(payload).select("*").maybeSingle();
      setSaving(false);
      if (error) return toast.error(error.message);
      if (data) { onSaved(data as VehicleRow, true); toast.success("Veículo adicionado"); onClose(); }
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Editar veículo" : "Novo veículo"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Título do anúncio" className="md:col-span-2">
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Honda Civic EXL 2020 Automático" />
          </Field>
          <Field label="Marca"><input className={inputCls} value={brand} onChange={(e) => setBrand(e.target.value)} /></Field>
          <Field label="Modelo"><input className={inputCls} value={model} onChange={(e) => setModel(e.target.value)} /></Field>
          <Field label="Ano"><input className={inputCls} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" /></Field>
          <Field label="Quilometragem"><input className={inputCls} value={km} onChange={(e) => setKm(e.target.value)} inputMode="numeric" placeholder="45000" /></Field>
          <Field label="Preço (R$)"><input className={inputCls} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="89900" /></Field>
          <Field label="Cor"><input className={inputCls} value={color} onChange={(e) => setColor(e.target.value)} /></Field>
          <Field label="Combustível">
            <select className={inputCls} value={fuel} onChange={(e) => setFuel(e.target.value)}>
              <option value="">Selecione…</option>
              {FUELS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Câmbio">
            <select className={inputCls} value={transmission} onChange={(e) => setTransmission(e.target.value)}>
              <option value="">Selecione…</option>
              {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Descrição" className="md:col-span-2">
            <textarea className={inputCls} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={800} />
          </Field>
        </div>

        <div className="mt-2">
          <p className="text-sm font-medium">Fotos</p>
          <p className="text-xs text-muted-foreground">Arraste para reordenar. A primeira foto é usada como capa no site.</p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((url, i) => (
              <div
                key={url + i}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                onDragLeave={() => setDragOver((prev) => (prev === i ? null : prev))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIdx !== null) movePhoto(dragIdx, i);
                  setDragIdx(null); setDragOver(null);
                }}
                onDragEnd={() => { setDragIdx(null); setDragOver(null); }}
                className={`group relative aspect-[4/3] cursor-grab overflow-hidden rounded-lg border-2 bg-muted transition ${
                  dragOver === i ? "border-primary ring-2 ring-primary/30" : "border-border"
                } ${dragIdx === i ? "opacity-40" : ""}`}
              >
                <img src={url} alt="" className="pointer-events-none h-full w-full object-cover" draggable={false} />
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">Capa</span>}
                <span className="absolute bottom-1 left-1 rounded bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100">
                  <GripVertical className="h-3 w-3" />
                </span>
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Remover foto"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="grid aspect-[4/3] place-items-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <div className="text-center">
                  <Upload className="mx-auto h-5 w-5" />
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wider">Adicionar</p>
                </div>
              )}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadPhotos(e.target.files)}
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 rounded border-border" />
            Destacar no topo do estoque
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sold} onChange={(e) => setSold(e.target.checked)} className="h-4 w-4 rounded border-border" />
            Marcar como vendido (oculta do site)
          </label>
        </div>

        <DialogFooter>
          <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-surface">Cancelar</button>
          <button
            onClick={save}
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-elegant hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {existing ? "Salvar alterações" : "Adicionar veículo"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- utils ---------------- */
const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
