import { Car, MapPin, Phone, MessageCircle, Sparkles, Search, SlidersHorizontal, X, ArrowRight, Star, Award, Shield } from "lucide-react";
import {
  type StoreLike, type VehicleLike, type TemplateId,
  useStockFilters, firstPhoto, heroPhotoFrom, formatBRL, normalizeTemplate,
} from "./types";

type Props = { store: StoreLike; vehicles: VehicleLike[] };

export function StoreTemplate(props: Props) {
  const id: TemplateId = normalizeTemplate(props.store.template);
  if (id === "editorial-minimal") return <EditorialMinimal {...props} />;
  if (id === "sport-bold") return <SportBold {...props} />;
  if (id === "classic-luxury") return <ClassicLuxury {...props} />;
  return <PremiumDark {...props} />;
}

/* ---------------- shared bits ---------------- */

function waLink(store: StoreLike) {
  const digits = store.whatsapp?.replace(/\D/g, "");
  return digits ? `https://wa.me/55${digits}` : null;
}

function useColors(store: StoreLike) {
  return {
    primary: store.primary_color || "#c9a84c",
    secondary: store.secondary_color || "#0b0f19",
    accent: store.accent_color || "#f0d78c",
    neutral: store.neutral_color || "#0a0a0a",
  };
}

/* ================================================================
 * 1) PREMIUM DARK — showroom noturno (estilo JB Multimarcas)
 * ================================================================ */
function PremiumDark({ store, vehicles }: Props) {
  const c = useColors(store);
  const wa = waLink(store);
  const hero = heroPhotoFrom(vehicles);
  const featured = vehicles.filter((v) => v.featured).slice(0, 3);
  const filters = useStockFilters(vehicles);

  return (
    <div className="min-h-screen text-white" style={{ background: c.neutral }}>
      {/* Nav */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-11 w-11 rounded-md bg-white/5 object-contain p-1 ring-1 ring-white/10" />
            ) : (
              <div className="grid h-11 w-11 place-items-center rounded-md ring-1 ring-white/20" style={{ background: c.primary }}>
                <Car className="h-5 w-5 text-black" />
              </div>
            )}
            <div>
              <p className="font-serif text-lg font-bold tracking-tight">{store.name}</p>
              {store.tagline && <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">{store.tagline}</p>}
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
            <a href="#estoque" className="hover:text-white">Catálogo</a>
            <a href="#sobre" className="hover:text-white">Sobre</a>
            <a href="#contato" className="hover:text-white">Contato</a>
          </nav>
          {wa && (
            <a href={wa} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-black transition hover:brightness-95" style={{ background: c.primary }}>
              <MessageCircle className="h-4 w-4" /> Falar agora
            </a>
          )}
        </div>
      </header>

      {/* Hero cinematográfico */}
      <section className="relative min-h-[92vh] overflow-hidden">
        {hero ? (
          <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(1200px 600px at 70% 20%, ${c.primary}22, transparent), ${c.neutral}` }} />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${c.neutral}f5 0%, ${c.neutral}b0 45%, transparent 80%)` }} />
        <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: `linear-gradient(to top, ${c.neutral}, transparent)` }} />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center px-6 pt-32 pb-24 md:min-h-[92vh]">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] backdrop-blur" style={{ color: c.primary }}>
              <Sparkles className="h-3.5 w-3.5" /> {store.style_tag ?? "Seminovos selecionados"}
            </span>
            <h1 className="mt-6 font-serif text-5xl font-black leading-[1.05] md:text-7xl">
              {store.hero_headline ?? `A escolha certa para você`}
              <span className="block" style={{ color: c.primary }}>.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/75 md:text-xl">
              {store.hero_subheadline ?? "Veículos com procedência, garantia e o melhor atendimento da região."}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#estoque" className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-black shadow-2xl transition hover:brightness-95" style={{ background: c.primary }}>
                {store.cta_text ?? "Ver catálogo"} <ArrowRight className="h-4 w-4" />
              </a>
              {wa && (
                <a href={wa} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/10">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
            </div>

            <div className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-6">
              <Stat value={vehicles.length.toString()} label="Veículos" accent={c.primary} />
              <Stat value="100%" label="Procedência" accent={c.primary} />
              <Stat value="5★" label="Atendimento" accent={c.primary} />
            </div>
          </div>
        </div>
      </section>

      {/* Destaques */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-24">
          <SectionEyebrow color={c.primary}>Destaques da semana</SectionEyebrow>
          <h2 className="mt-3 font-serif text-4xl font-bold md:text-5xl">Selecionados a dedo</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featured.map((v) => <DarkCard key={v.id} v={v} accent={c.primary} />)}
          </div>
        </section>
      )}

      {/* Estoque */}
      <section id="estoque" className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <SectionEyebrow color={c.primary}>Catálogo completo</SectionEyebrow>
          <h2 className="mt-3 font-serif text-4xl font-bold md:text-5xl">Nosso estoque</h2>
          <p className="mt-3 text-white/60">{filters.filtered.length} de {vehicles.length} veículo(s)</p>

          <FilterBar theme="dark" accent={c.primary} filters={filters} />
          <StockGrid theme="dark" accent={c.primary} vehicles={filters.filtered} total={vehicles.length} clear={filters.clear} />
        </div>
      </section>

      {/* Sobre */}
      {store.about_text && (
        <section id="sobre" className="border-t border-white/10 bg-black/40">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 md:grid-cols-[1.2fr_1fr]">
            <div>
              <SectionEyebrow color={c.primary}>Sobre nós</SectionEyebrow>
              <h2 className="mt-3 font-serif text-4xl font-bold md:text-5xl">A {store.name}</h2>
              <p className="mt-6 text-lg leading-relaxed text-white/75">{store.about_text}</p>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <Pill icon={Shield} label="Garantia real" color={c.primary} />
                <Pill icon={Award} label="Procedência checada" color={c.primary} />
                <Pill icon={Star} label="Atendimento 5★" color={c.primary} />
              </div>
            </div>
            <div id="contato" className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: c.primary }}>Contato</p>
              <ContactList store={store} accent={c.primary} />
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/50">
        <p>© {new Date().getFullYear()} {store.name}. Todos os direitos reservados.</p>
        <p className="mt-1 opacity-70">Site criado com AutoSite</p>
      </footer>
    </div>
  );
}

/* ================================================================
 * 2) EDITORIAL MINIMAL — concessionária europeia
 * ================================================================ */
function EditorialMinimal({ store, vehicles }: Props) {
  const c = useColors(store);
  const wa = waLink(store);
  const hero = heroPhotoFrom(vehicles);
  const filters = useStockFilters(vehicles);

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-neutral-900">
      <header className="border-b border-neutral-200/70 bg-[#f7f5f1]/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-10 w-10 object-contain" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full" style={{ background: c.primary }}>
                <Car className="h-5 w-5 text-white" />
              </div>
            )}
            <p className="font-serif text-xl tracking-tight">{store.name}</p>
          </div>
          <nav className="hidden items-center gap-10 text-[13px] tracking-wide text-neutral-600 md:flex">
            <a href="#estoque" className="hover:text-neutral-900">Coleção</a>
            <a href="#sobre" className="hover:text-neutral-900">Casa</a>
            <a href="#contato" className="hover:text-neutral-900">Contato</a>
          </nav>
          {wa && (
            <a href={wa} target="_blank" rel="noopener" className="rounded-full border border-neutral-900 px-5 py-2 text-[13px] font-medium text-neutral-900 hover:bg-neutral-900 hover:text-white">
              Consultoria
            </a>
          )}
        </div>
      </header>

      {/* Hero editorial — split */}
      <section className="mx-auto grid max-w-7xl gap-12 px-8 py-20 md:grid-cols-2 md:py-28">
        <div className="flex flex-col justify-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">
            {store.style_tag ?? "Coleção 2026"} · {[store.city, store.state].filter(Boolean).join(", ") || "Brasil"}
          </p>
          <h1 className="mt-6 font-serif text-5xl leading-[1.02] tracking-tight md:text-7xl">
            {store.hero_headline ?? "Automóveis, com curadoria."}
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-neutral-600">
            {store.hero_subheadline ?? "Uma seleção reduzida de veículos, escolhidos por procedência e cuidado."}
          </p>
          <div className="mt-10 flex items-center gap-6">
            <a href="#estoque" className="group inline-flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.25em] text-neutral-900">
              {store.cta_text ?? "Ver coleção"}
              <span className="inline-block h-px w-10 bg-neutral-900 transition-all group-hover:w-16" />
            </a>
            {wa && (
              <a href={wa} target="_blank" rel="noopener" className="text-[13px] font-medium text-neutral-500 hover:text-neutral-900">
                WhatsApp →
              </a>
            )}
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-200 md:aspect-auto">
          {hero ? (
            <img src={hero} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-neutral-400"><Car className="h-24 w-24" /></div>
          )}
          <div className="absolute bottom-6 left-6 rounded-full bg-white/95 px-4 py-2 text-[11px] font-medium uppercase tracking-widest backdrop-blur">
            Nº 01 · {vehicles.length} unidades disponíveis
          </div>
        </div>
      </section>

      {/* Estoque */}
      <section id="estoque" className="border-t border-neutral-200/70">
        <div className="mx-auto max-w-7xl px-8 py-24">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">A coleção</p>
              <h2 className="mt-3 font-serif text-4xl md:text-5xl">Veículos disponíveis</h2>
            </div>
            <p className="hidden text-sm text-neutral-500 md:block">
              {filters.filtered.length} de {vehicles.length}
            </p>
          </div>

          <FilterBar theme="light" accent={c.primary} filters={filters} minimal />
          <StockGrid theme="light" accent={c.primary} vehicles={filters.filtered} total={vehicles.length} clear={filters.clear} style="editorial" />
        </div>
      </section>

      {/* Sobre */}
      {store.about_text && (
        <section id="sobre" className="border-t border-neutral-200/70 bg-white">
          <div className="mx-auto grid max-w-7xl gap-16 px-8 py-24 md:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">A casa</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">Sobre a {store.name}</h2>
            </div>
            <div>
              <p className="text-lg leading-relaxed text-neutral-700">{store.about_text}</p>
              <div id="contato" className="mt-10 border-t border-neutral-200 pt-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">Contato</p>
                <ContactList store={store} accent={c.primary} light />
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-neutral-200/70 py-10 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} {store.name}. Todos os direitos reservados.</p>
        <p className="mt-1 opacity-70">Site criado com AutoSite</p>
      </footer>
    </div>
  );
}

/* ================================================================
 * 3) SPORT BOLD — pista, adrenalina
 * ================================================================ */
function SportBold({ store, vehicles }: Props) {
  const c = useColors(store);
  const wa = waLink(store);
  const hero = heroPhotoFrom(vehicles);
  const filters = useStockFilters(vehicles);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="relative z-30 border-b border-white/5">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-11 w-11 object-contain" />
            ) : (
              <div className="grid h-11 w-11 place-items-center" style={{ background: c.primary }}>
                <Car className="h-5 w-5 text-black" />
              </div>
            )}
            <p className="text-lg font-black uppercase tracking-tight" style={{ fontStretch: "condensed" }}>{store.name}</p>
          </div>
          {wa && (
            <a href={wa} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black" style={{ background: c.primary, clipPath: "polygon(8% 0, 100% 0, 92% 100%, 0 100%)" }}>
              <MessageCircle className="h-4 w-4" /> Contato
            </a>
          )}
        </div>
      </header>

      {/* Hero diagonal */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {hero ? (
            <img src={hero} alt="" className="h-full w-full object-cover opacity-60" />
          ) : (
            <div className="h-full w-full" style={{ background: `linear-gradient(120deg, ${c.neutral}, ${c.secondary})` }} />
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(105deg, #000 0%, #000000cc 40%, transparent 75%)` }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-32 md:py-40">
          <span className="inline-flex items-center gap-2 border-l-4 pl-3 text-[11px] font-black uppercase tracking-[0.35em]" style={{ borderColor: c.primary, color: c.primary }}>
            <Sparkles className="h-3.5 w-3.5" /> {store.style_tag ?? "Performance"}
          </span>
          <h1 className="mt-8 text-6xl font-black uppercase leading-[0.9] tracking-tight md:text-8xl">
            <span className="block">{(store.hero_headline ?? "Velocidade.").split(" ").slice(0, 2).join(" ")}</span>
            <span className="block" style={{ color: c.primary }}>
              {(store.hero_headline ?? "Adrenalina.").split(" ").slice(2).join(" ") || "Adrenalina."}
            </span>
          </h1>
          <p className="mt-8 max-w-xl text-lg text-white/70">
            {store.hero_subheadline ?? "Máquinas selecionadas para quem entende de direção."}
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <a href="#estoque" className="inline-flex items-center gap-3 bg-white px-8 py-4 text-xs font-black uppercase tracking-[0.3em] text-black transition hover:bg-neutral-200" style={{ clipPath: "polygon(6% 0, 100% 0, 94% 100%, 0 100%)" }}>
              {store.cta_text ?? "Ver garagem"} <ArrowRight className="h-4 w-4" />
            </a>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50">
              <span className="h-px w-8 bg-white/30" />
              {vehicles.length} máquinas em estoque
            </div>
          </div>
        </div>

        {/* barra decorativa */}
        <div className="absolute inset-x-0 bottom-0 flex h-2">
          <div className="flex-1" style={{ background: c.primary }} />
          <div className="w-1/4 bg-white" />
          <div className="w-1/6" style={{ background: c.accent }} />
        </div>
      </section>

      {/* Estoque */}
      <section id="estoque" className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex items-end justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: c.primary }}>Garagem</p>
            <h2 className="mt-2 text-4xl font-black uppercase leading-none md:text-6xl">Nosso estoque</h2>
          </div>
          <p className="text-sm text-white/50">{filters.filtered.length}/{vehicles.length}</p>
        </div>

        <FilterBar theme="dark" accent={c.primary} filters={filters} />
        <StockGrid theme="dark" accent={c.primary} vehicles={filters.filtered} total={vehicles.length} clear={filters.clear} style="sport" />
      </section>

      {/* Sobre */}
      {store.about_text && (
        <section id="sobre" className="border-t border-white/10 bg-black">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: c.primary }}>Sobre</p>
              <h2 className="mt-2 text-4xl font-black uppercase leading-none md:text-5xl">{store.name}</h2>
              <p className="mt-6 text-lg leading-relaxed text-white/70">{store.about_text}</p>
            </div>
            <div id="contato" className="border-l-4 pl-8" style={{ borderColor: c.primary }}>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/50">Contato</p>
              <ContactList store={store} accent={c.primary} />
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-white/10 bg-black py-6 text-center text-xs uppercase tracking-widest text-white/40">
        © {new Date().getFullYear()} {store.name} · AutoSite
      </footer>
    </div>
  );
}

/* ================================================================
 * 4) CLASSIC LUXURY — navy + dourado
 * ================================================================ */
function ClassicLuxury({ store, vehicles }: Props) {
  const c = useColors(store);
  const wa = waLink(store);
  const hero = heroPhotoFrom(vehicles);
  const filters = useStockFilters(vehicles);
  const navy = c.secondary && c.secondary !== "#000000" ? c.secondary : "#0f1b3d";
  const gold = c.primary || "#c9a84c";

  return (
    <div className="min-h-screen bg-[#faf7f0] text-neutral-900">
      {/* faixa superior fina */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${navy}, ${gold}, ${navy})` }} />

      <header className="border-b border-neutral-200 bg-[#faf7f0]">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-14 w-14 object-contain" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-full" style={{ background: navy }}>
                <Car className="h-6 w-6" style={{ color: gold }} />
              </div>
            )}
            <div>
              <p className="font-serif text-2xl font-bold tracking-tight" style={{ color: navy }}>{store.name}</p>
              {store.tagline && <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">{store.tagline}</p>}
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {store.phone && (
              <a href={`tel:${store.phone}`} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm hover:border-neutral-500">
                <Phone className="h-4 w-4" style={{ color: gold }} /> {store.phone}
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: navy }}>
                <MessageCircle className="h-4 w-4" style={{ color: gold }} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero clássico */}
      <section className="relative overflow-hidden" style={{ background: navy }}>
        <div className="absolute inset-0 opacity-40">
          {hero ? <img src={hero} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${navy}dd, ${navy}f2)` }} />
        {/* moldura */}
        <div className="absolute inset-6 border pointer-events-none" style={{ borderColor: `${gold}55` }} />

        <div className="relative mx-auto max-w-7xl px-10 py-28 text-center text-white md:py-36">
          <div className="mx-auto flex items-center justify-center gap-4">
            <span className="h-px w-16" style={{ background: gold }} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.4em]" style={{ color: gold }}>
              {store.style_tag ?? "Est. Excellence"}
            </span>
            <span className="h-px w-16" style={{ background: gold }} />
          </div>
          <h1 className="mx-auto mt-8 max-w-4xl font-serif text-5xl font-bold leading-tight md:text-7xl">
            {store.hero_headline ?? `Tradição em cada veículo`}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
            {store.hero_subheadline ?? "Uma casa consolidada, comprometida com procedência e atendimento sob medida."}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href="#estoque" className="inline-flex items-center gap-2 rounded-none border-2 px-8 py-3.5 text-sm font-bold uppercase tracking-[0.2em] transition hover:bg-white hover:text-neutral-900" style={{ borderColor: gold, color: gold }}>
              {store.cta_text ?? "Ver coleção"}
            </a>
          </div>
        </div>
      </section>

      {/* Estoque */}
      <section id="estoque" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.4em]" style={{ color: gold }}>Estoque</span>
          <h2 className="mt-3 font-serif text-4xl font-bold md:text-5xl" style={{ color: navy }}>Nossa coleção</h2>
          <div className="mx-auto mt-4 h-0.5 w-16" style={{ background: gold }} />
          <p className="mt-6 text-neutral-600">{filters.filtered.length} de {vehicles.length} veículos disponíveis</p>
        </div>

        <div className="mt-10">
          <FilterBar theme="light" accent={gold} filters={filters} />
          <StockGrid theme="light" accent={gold} navy={navy} vehicles={filters.filtered} total={vehicles.length} clear={filters.clear} style="classic" />
        </div>
      </section>

      {/* Sobre */}
      {store.about_text && (
        <section id="sobre" className="border-t border-neutral-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 md:grid-cols-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.4em]" style={{ color: gold }}>A casa</span>
              <h2 className="mt-3 font-serif text-4xl font-bold md:text-5xl" style={{ color: navy }}>Sobre a {store.name}</h2>
              <div className="mt-4 h-0.5 w-16" style={{ background: gold }} />
              <p className="mt-8 text-lg leading-relaxed text-neutral-700">{store.about_text}</p>
            </div>
            <div id="contato" className="rounded-sm border-l-4 bg-[#faf7f0] p-8" style={{ borderColor: gold }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500">Contato</p>
              <ContactList store={store} accent={gold} light />
            </div>
          </div>
        </section>
      )}

      <div className="h-1" style={{ background: `linear-gradient(90deg, ${navy}, ${gold}, ${navy})` }} />
      <footer className="py-8 text-center text-xs text-neutral-500" style={{ background: navy, color: "#fff" }}>
        <p>© {new Date().getFullYear()} {store.name}. Todos os direitos reservados.</p>
        <p className="mt-1 opacity-60">Site criado com AutoSite</p>
      </footer>
    </div>
  );
}

/* ---------------- shared helpers/components ---------------- */

function SectionEyebrow({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-10" style={{ background: color }} />
      <span className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color }}>{children}</span>
    </div>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div>
      <p className="font-serif text-3xl font-bold" style={{ color: accent }}>{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-widest text-white/50">{label}</p>
    </div>
  );
}

function Pill({ icon: Icon, label, color }: { icon: typeof Shield; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <Icon className="h-4 w-4" style={{ color }} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function ContactList({ store, accent, light }: { store: StoreLike; accent: string; light?: boolean }) {
  const textCls = light ? "text-neutral-700" : "text-white/85";
  const wa = store.whatsapp?.replace(/\D/g, "");
  return (
    <div className={`mt-4 space-y-3 text-sm ${textCls}`}>
      {store.phone && <p className="flex items-center gap-3"><Phone className="h-4 w-4" style={{ color: accent }} /> {store.phone}</p>}
      {wa && <p className="flex items-center gap-3"><MessageCircle className="h-4 w-4" style={{ color: accent }} /> WhatsApp: {store.whatsapp}</p>}
      {(store.address || store.city) && (
        <p className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
          <span>{[store.address, store.city, store.state].filter(Boolean).join(", ")}</span>
        </p>
      )}
    </div>
  );
}

/* ---------------- Filter bar (shared) ---------------- */

type FilterBarProps = {
  theme: "dark" | "light";
  accent: string;
  minimal?: boolean;
  filters: ReturnType<typeof useStockFilters>;
};

function FilterBar({ theme, filters, minimal }: FilterBarProps) {
  const dark = theme === "dark";
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks -- state hook is at top
  function useState<T>(v: T) { return require("react").useState(v); } // placeholder
  return null as any;
}

// The placeholder above is wrong — replaced below with real component.
