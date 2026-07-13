import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, ArrowLeft, Check, Loader2, Upload, Sparkles, Car,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { extractPaletteFromFile, type Palette } from "@/lib/palette";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [{ title: "Configurar sua loja — AutoSite" }, { name: "robots", content: "noindex" }],
  }),
  component: Onboarding,
});

type Plan = "start" | "pro" | "premium";
const PLANS: { id: Plan; name: string; price: string; features: string[]; highlight?: boolean }[] = [
  { id: "start", name: "Start", price: "R$ 149/mês", features: ["Até 30 veículos", "Domínio personalizado", "SEO básico"] },
  { id: "pro", name: "Pro", price: "R$ 299/mês", highlight: true, features: ["150 veículos", "Blog + Chatbot IA", "Múltiplos usuários"] },
  { id: "premium", name: "Premium", price: "R$ 599/mês", features: ["Ilimitado", "CRM completo", "OLX, Webmotors, iCarros"] },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [plan, setPlan] = useState<Plan>("pro");
  const [storeName, setStoreName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [palette, setPalette] = useState<Palette | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const slug = useMemo(
    () => storeName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    [storeName],
  );

  const onFile = async (f: File) => {
    setFile(f);
    setLogoPreview(URL.createObjectURL(f));
    setAnalyzing(true);
    try {
      const p = await extractPaletteFromFile(f);
      setPalette(p);
    } catch {
      toast.error("Não foi possível analisar a imagem. Tente outro arquivo.");
    } finally {
      setAnalyzing(false);
    }
  };

  const finish = async () => {
    if (!file || !palette || !storeName) return;
    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Sessão expirada");

      // Upload logo
      const ext = file.name.split(".").pop() || "png";
      const path = `${uid}/${slug || "loja"}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("logos").createSignedUrl(path, 60 * 60 * 24 * 365);

      // Ensure slug uniqueness
      let finalSlug = slug || `loja-${Date.now()}`;
      const { data: existing } = await supabase.from("stores").select("id").eq("slug", finalSlug).maybeSingle();
      if (existing) finalSlug = `${finalSlug}-${Math.floor(Math.random() * 1000)}`;

      const { error: insErr } = await supabase.from("stores").insert({
        owner_id: uid,
        name: storeName,
        slug: finalSlug,
        plan,
        logo_url: signed?.signedUrl ?? path,
        primary_color: palette.primary,
        secondary_color: palette.secondary,
        accent_color: palette.accent,
        neutral_color: palette.neutral,
        style_tag: palette.style,
        onboarded: true,
      });
      if (insErr) throw insErr;

      toast.success("Loja criada! Bem-vindo ao painel.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const canNext =
    (step === 0 && !!plan) ||
    (step === 1 && storeName.trim().length > 2) ||
    (step === 2 && !!palette) ||
    step === 3;

  return (
    <div className="min-h-screen bg-gradient-hero px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">AutoSite</span>
          </a>
          <Stepper current={step} />
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-elegant md:p-12">
          {step === 0 && <StepPlan plan={plan} setPlan={setPlan} />}
          {step === 1 && <StepStoreName name={storeName} setName={setStoreName} slug={slug} />}
          {step === 2 && (
            <StepLogo
              file={file} logoPreview={logoPreview} palette={palette} analyzing={analyzing}
              onFile={onFile}
            />
          )}
          {step === 3 && <StepReview storeName={storeName} plan={plan} palette={palette!} logoPreview={logoPreview!} />}

          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1) as typeof step)}
              disabled={step === 0}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as typeof step)}
                disabled={!canNext}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:brightness-110 disabled:opacity-50"
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={saving || !palette || !file}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:brightness-110 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar minha loja <Sparkles className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Steps */
function Stepper({ current }: { current: number }) {
  const labels = ["Plano", "Loja", "Logo", "Revisão"];
  return (
    <div className="hidden items-center gap-2 md:flex">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-2">
          <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
            i <= current ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"
          }`}>{i + 1}</div>
          <span className={`text-sm ${i <= current ? "text-foreground" : "text-muted-foreground"}`}>{l}</span>
          {i < labels.length - 1 && <div className="mx-2 h-px w-8 bg-border" />}
        </div>
      ))}
    </div>
  );
}

function StepPlan({ plan, setPlan }: { plan: Plan; setPlan: (p: Plan) => void }) {
  return (
    <div>
      <h2 className="font-display text-3xl font-bold">Escolha seu plano</h2>
      <p className="mt-2 text-muted-foreground">Comece grátis por 7 dias. Cancele quando quiser.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPlan(p.id)}
            className={`relative rounded-2xl border p-6 text-left transition ${
              plan === p.id ? "border-primary bg-primary/5 shadow-elegant" : "border-border hover:border-primary/40"
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-2 right-4 rounded-full bg-gradient-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                Popular
              </span>
            )}
            <h3 className="font-display text-xl font-bold">{p.name}</h3>
            <p className="mt-1 text-sm text-primary">{p.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-primary" /> {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepStoreName({ name, setName, slug }: { name: string; setName: (v: string) => void; slug: string }) {
  return (
    <div>
      <h2 className="font-display text-3xl font-bold">Como se chama sua revenda?</h2>
      <p className="mt-2 text-muted-foreground">Isso vai aparecer no seu site e no seu subdomínio.</p>
      <div className="mt-8 space-y-3">
        <label className="block">
          <span className="text-sm text-muted-foreground">Nome da loja</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Prime Motors"
            className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary"
          />
        </label>
        <div className="rounded-xl border border-border bg-surface/50 px-4 py-3 font-mono text-sm text-muted-foreground">
          {(slug || "sua-loja")}.autosite.com.br
        </div>
      </div>
    </div>
  );
}

function StepLogo({
  file, logoPreview, palette, analyzing, onFile,
}: {
  file: File | null; logoPreview: string | null; palette: Palette | null; analyzing: boolean;
  onFile: (f: File) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-3xl font-bold">Envie sua logomarca</h2>
      <p className="mt-2 text-muted-foreground">
        Nossa IA analisa cores e estilo em segundos. Formatos: PNG, JPG, SVG.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <label className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface/40 p-8 text-center transition hover:border-primary hover:bg-surface">
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain" />
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary" />
              <p className="mt-3 font-medium">Clique para enviar ou arraste</p>
              <p className="mt-1 text-xs text-muted-foreground">Máximo 5 MB</p>
            </>
          )}
        </label>

        <div className="rounded-2xl border border-border bg-surface/40 p-6">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Análise da IA
          </h3>
          {analyzing && (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analisando cores e estilo…
            </div>
          )}
          {!analyzing && !palette && (
            <p className="mt-6 text-sm text-muted-foreground">
              Envie sua logo para ver a paleta gerada.
            </p>
          )}
          {palette && (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Estilo detectado</p>
                <p className="mt-1 font-display text-xl font-bold capitalize text-gradient">{palette.style}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Paleta</p>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {([
                    ["Primária", palette.primary],
                    ["Secundária", palette.secondary],
                    ["Destaque", palette.accent],
                    ["Neutra", palette.neutral],
                  ] as const).map(([label, color]) => (
                    <div key={label} className="rounded-lg border border-border overflow-hidden">
                      <div className="aspect-square" style={{ background: color }} />
                      <div className="px-2 py-1.5 text-[10px]">
                        <p className="font-medium">{label}</p>
                        <p className="font-mono text-muted-foreground">{color}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {file && <p className="mt-4 text-xs text-muted-foreground">Arquivo: {file.name}</p>}
    </div>
  );
}

function StepReview({
  storeName, plan, palette, logoPreview,
}: { storeName: string; plan: Plan; palette: Palette; logoPreview: string }) {
  return (
    <div>
      <h2 className="font-display text-3xl font-bold">Tudo pronto!</h2>
      <p className="mt-2 text-muted-foreground">Confira antes de gerar seu site.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Loja</p>
          <p className="mt-1 font-display text-2xl font-bold">{storeName}</p>
          <p className="mt-1 text-sm text-muted-foreground">Plano: <span className="capitalize text-primary">{plan}</span></p>
          <p className="mt-1 text-sm text-muted-foreground">Estilo: <span className="capitalize">{palette.style}</span></p>
        </div>
        <div className="rounded-2xl border border-border p-6">
          <div className="flex items-center gap-4">
            <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-lg bg-white object-contain p-2" />
            <div className="flex gap-1.5">
              {[palette.primary, palette.secondary, palette.accent, palette.neutral].map((c) => (
                <div key={c} className="h-10 w-10 rounded-lg border border-border" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
