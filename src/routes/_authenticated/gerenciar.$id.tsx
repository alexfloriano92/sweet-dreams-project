import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Car, ExternalLink, Loader2, Plus, Save, Trash2, Upload, X, Star, CheckCircle2,
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
  const [tab, setTab] = useState<"info" | "textos" | "veiculos">("info");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleRow | null>(null);

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

        <div className="mt-6 flex gap-1 border-b border-border">
          {([
            ["info", "Informações"],
            ["textos", "Textos"],
            ["veiculos", `Veículos (${vehicles.length})`],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
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
            />
          )}
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
  vehicles, onAdd, onEdit, onDelete,
}: {
  vehicles: VehicleRow[];
  onAdd: () => void;
  onEdit: (v: VehicleRow) => void;
  onDelete: (v: VehicleRow) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Estoque de veículos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre e gerencie os carros exibidos no seu site.</p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Novo veículo
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-surface/30 p-10 text-center">
          <Car className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Nenhum veículo cadastrado</p>
          <p className="mt-1 text-sm text-muted-foreground">Clique em "Novo veículo" para começar seu estoque.</p>
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
          <p className="text-xs text-muted-foreground">A primeira foto é usada como capa no site.</p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((url, i) => (
              <div key={url + i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
                <img src={url} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">Capa</span>}
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
