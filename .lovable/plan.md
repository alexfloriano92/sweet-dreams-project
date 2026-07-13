# SaaS Website Builder para Revendas de Veículos

O escopo enviado é enorme (builder com IA, CRM, marketing, integrações com Webmotors/OLX/iCarros, multi-tenant, pagamentos duplos, etc.). Não dá para entregar tudo em uma única iteração de forma confiável — vamos construir em fases, validando cada uma antes de avançar.

## Fase 1 — Fundação e Landing Institucional (esta entrega)

Objetivo: ter a plataforma "vendável" no ar com identidade premium, planos e captação.

1. **Design System premium** (dark, sofisticado, automotivo) — tokens em `src/styles.css`, tipografia distinta, gradientes e sombras próprias.
2. **Landing pública** do SaaS:
   - Hero com proposta de valor + CTA
   - Como funciona (upload logo → IA gera site)
   - Demonstração visual do gerador de identidade
   - Planos (Start / Pro / Premium) com preços
   - Diferenciais / integrações
   - FAQ + rodapé + LGPD
3. **SEO completo** por rota (title, description, OG).
4. **Autenticação** (Lovable Cloud — email/senha + Google) e área logada mínima.
5. **Onboarding**: escolher plano → upload de logo → preview de paleta gerada (extração de cores real via Canvas, IA mock nesta fase).

## Fase 2 — Gerador com IA + Preview do Site

- Integração Lovable AI (Gemini) para gerar paleta, copy, layout config a partir da logo.
- Preview em tempo real do site gerado da revenda.
- Subdomínio `nomedaloja.plataforma` (roteamento multi-tenant).

## Fase 3 — Backend do Lojista

- Cadastro de veículos (com IA para título/descrição/SEO).
- Upload múltiplo de fotos + storage.
- Dashboard com KPIs.
- Site público da revenda (hero, busca, listagem, página do veículo).

## Fase 4 — CRM, Leads e Marketing

- Kanban de leads, WhatsApp, formulários, favoritos.
- Blog, cupons, campanhas.

## Fase 5 — Pagamentos e Integrações externas

- Stripe/Mercado Pago para assinatura de planos.
- Resend para emails transacionais.
- Integrações Webmotors/OLX/iCarros/Meta/Google (dependem de credenciais de API do usuário — várias exigem parceria comercial, não são APIs públicas abertas).
- Domínio próprio.

## Observações técnicas importantes

- **Stack real do projeto**: TanStack Start + React + Tailwind v4 + Lovable Cloud (Supabase gerenciado). Não é Next.js/Vercel — funciona de forma equivalente (SSR, edge functions, deploy gerenciado).
- **IA**: usaremos **Lovable AI Gateway** (Gemini/OpenAI) já incluído, sem exigir chave OpenAI do usuário.
- **Integrações Webmotors/iCarros/OLX**: não possuem API pública universal — normalmente exigem contrato B2B. Serão implementadas quando você tiver as credenciais/contratos.
- **Pagamentos**: recomendo começar com **Stripe integrado do Lovable** (sem precisar de conta Stripe) ou **Paddle** (MoR, cuida de impostos). Mercado Pago pode ser adicionado depois.

## O que entrego agora (Fase 1)

- Design system premium automotivo.
- Landing pública completa com todas as seções (hero, como funciona, planos, diferenciais, FAQ, footer).
- SEO por rota.
- Estrutura pronta para as próximas fases.

Confirma que posso seguir com a **Fase 1** assim? Se quiser priorizar outra fase primeiro (ex.: começar direto pelo cadastro de veículos), me avise.