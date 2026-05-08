# Reporte Scout — Ideas/Funcionalidades para Portar a maureldev

**Alcance:** inspeccionar `devdock` + `crmdev-web` para ideas aplicables a maureldev (dashboard GitHub self-hosted, Next 16 + Drizzle + Better Auth + Redis + Dokploy).
**Fecha:** 2026-05-08

---

## maureldev — Línea Base Actual (contexto relevante)

- **Stack:** Next.js 16.2.5 + React 19, Drizzle + Postgres 16, Better Auth (OAuth GitHub, encriptación AES-256-GCM), Redis (caché con ETag), shadcn/ui + Tailwind 4, Dokploy.
- **Entregado:** auth, KPI dashboard, repos (list/detail/files/insights), issues, PRs, stars, projects v2, packages, notificaciones, actividad, GH Actions runs, switch multi-org, comentarios (read+write Wave 4), settings.
- **Backlog abierto:** migración GitHub App, búsqueda Cmd+K global, telemetría/observabilidad, banner rate-limit, búsquedas guardadas, sidebar móvil (hamburger sheet).

---

## Candidatos Top para Portar (clasificados por ROI)

### S-tier (alto valor, bajo esfuerzo, encaja stack)

1. **Sistema tema 3-modos (Dev / Business / Light)** — *crmdev-web*
   - Refs: `src/lib/themes.ts`, `src/components/theme-switcher.tsx`, `docs/theme-system.md`
   - Por qué: maureldev hoy es light/dark/system. Agregar tema "Dev" mono-técnico (JetBrains Mono / accent lima) refuerza posicionamiento "para desarrolladores" ya en IBM Plex Mono. Usa `next-themes` (ya en maureldev) + CSS vars por clase. Drop-in.
   - Esfuerzo: S. ~1 fase.

2. **Plantillas email transaccionales (JSX vía @react-email)** — *crmdev-web*
   - Refs: `src/emails/*.tsx`
   - Por qué: `/notifications` maureldev es solo in-app. Emails salientes: PR asignado, issue mencionado, repo starred, alerta seguridad, estado deploy (GH Actions). Templates JSX superan Markdown para consistencia brand. Pair con Resend.
   - Esfuerzo: M. Agregar provider + 5 templates + cron/webhook trigger.

3. **Server Action envelope respuesta + patrón validación tenant** — *crmdev-web*
   - Patrón: `type ActionResponse<T> = {success:true,data:T} | {success:false,error:string}` + siempre validar session antes de DB.
   - Por qué: Wave 4 maureldev agregó errores tipados. Codificar envelope da toasts consistentes UI y unifica error UX across actions. Refactor barato existentes.
   - Esfuerzo: S–M.

4. **Command Palette upgrade — índice búsqueda global** — ambos proyectos + backlog maureldev
   - Refs: `crmdev-web/src/components/command-palette.tsx`, contexto búsqueda layout devdock.
   - Por qué: maureldev ya tiene Cmd+K shell pero sin índice searchable. Indexar repos/issues/PRs/orgs cached en Redis (ya deployed) → fuzzy instant across todas GitHub entities. UX win alto.
   - Esfuerzo: M. Index builder + cmdk wiring.

5. **Endpoint servidor MCP para agentes AI** — *crmdev-web*
   - Refs: `src/lib/mcp.ts`, `src/app/api/mcp/{rest,sse}/route.ts`, `docs/MCP_API.md`
   - Por qué: diferenciador gigante — exponer `list_repos`, `list_prs`, `list_issues`, `get_stars`, `get_actions_status` como tools MCP para que Claude/otros agentes manejen GitHub vía maureldev. API keys por-usuario.
   - Esfuerzo: M–L. Necesita model API key + MCP SDK wiring + schemas tool.

6. **Indicador sync status (pastilla frescura caché live)** — *devdock*
   - Ref: `apps/desktop/src/components/auth/sync-status-indicator.tsx`
   - Por qué: maureldev cachea respuestas GH 300–600s en Redis. Surface frescura ("synced 2m ago / refetching / stale") — convierte caché en feature vs hidden behavior. Pairs con banner rate-limit planeado.
   - Esfuerzo: S.

### A-tier (valor real, más esfuerzo)

7. **Hooks automatización n8n + Telegram** — *crmdev-web*
   - Refs: `n8n-crm-workflow.json`, `n8n-telegram-saas.json`, `src/app/api/webhooks/tickets/route.ts`
   - Por qué: webhooks GitHub → maureldev `/api/webhooks/github` → n8n → Telegram/Discord/Slack. Útil devs solo ("alértame repo starred / issue nuevo").
   - Esfuerzo: M. Webhook receiver + signature verify + workflows n8n ejemplo.

8. **Rate limiting endpoints API (Upstash)** — *crmdev-web*
   - Ref: `src/lib/rate-limit.ts`
   - Por qué: maureldev expone rutas user; endpoint MCP (si agrega) necesita throttling per-key. Ya tienen Redis — pueden usar `@upstash/ratelimit` contra Redis Dokploy o upstream.
   - Esfuerzo: S.

9. **API Keys management UI (tokens PAT-style per-user para MCP/external)** — *crmdev-web*
   - Refs: `src/actions/api-keys.ts`, model `ApiKey` Prisma.
   - Por qué: prerequisito para #5 (MCP). Almacenamiento hashed, scoped, revocable.
   - Esfuerzo: M. Model Drizzle + CRUD actions + settings UI.

10. **Patrón mobile sidebar sheet** — *crmdev-web* + gap reconocido maureldev
    - Refs: `src/components/mobile/*`, `src/components/header.tsx`
    - Por qué: sidebar maureldev roto móvil. Patrón crmdev: hamburger → Sheet (Radix), triggers `lg:hidden`, drawer full-height. Idioma shadcn directo.
    - Esfuerzo: S.

11. **Health-score / puntuación frescura** — *devdock* roadmap P3
    - Por qué: computar badge "repo health" (commit recency × open PR age × stale issues × failing actions). Surface repo card. Diferenciador vs github.com.
    - Esfuerzo: M. Puro compute sobre datos ya-cached.

12. **View mode toggle (grid/list) en repo & PR lists** — *devdock*
    - Ref: `apps/web/src/pages/projects-page.tsx:14,23` (Segmented)
    - Por qué: maureldev layout único actualmente. Density toggle + list view boost poder-usuario UX.
    - Esfuerzo: S.

### B-tier (nice to have, niche, o ya-cubierto)

13. **Patrón soft delete / `deleted_at`** — *devdock* — relevante solo cuando maureldev agrega contenido user-generated (búsquedas guardadas, filtros pinned); skip hasta necesitar.
14. **Auto-trigger `updated_at`** — *devdock* — equivalente Drizzle: trigger SQL o `$onUpdate`. Hardening barato; hacer junto #9.
15. **Patrón TanStack Query key factory** — *devdock* — maureldev es RSC-first, bajo fit. Relevante solo si islas cliente crecen.
16. **Detección tech stack (badges Devicon)** — *devdock* — language badge ya en repo card; overlay devicon completo sería polish.
17. **Middleware multi-tenant Prisma** — *crmdev-web* — overkill maureldev (per-user, no multi-org-tenant igual forma). Skip unless feature team/workspace lands.
18. **Vitest para stores** — *devdock* — maureldev no tests hoy. Vale agregar pero no urgente — reporte diferente.

---

## Anti-patrones a NO portar

- **Verificación webhook crmdev-web** — flagged en propio `security-audit-report.md` como timing-attack vulnerable. Si portar #7, usar `crypto.timingSafeEqual` + HMAC-SHA256 desde día 1.
- **Valores empty string Select** (Radix throws) — usar sentinelas `"none"`/`"all"` (ya convención maureldev).
- **Abstracción `IApiClient` devdock** — diseñada desktop+web+mobile. maureldev web-only; abstraer prematuramente viola YAGNI.
- **Sync offline last-write-wins devdock** — irrelevante; maureldev always-online contra GitHub.

---

## Secuencia Roadmap Sugerida (propuesta Wave 5)

| Orden | Item | Esfuerzo | Desbloquea |
|-------|------|----------|-----------|
| 1 | Mobile sidebar sheet (#10) | S | Paridad UX |
| 2 | Sync status indicator (#6) | S | Transparencia caché |
| 3 | View mode toggle (#12) | S | Preferencia densidad |
| 4 | Server action envelope refactor (#3) | S–M | Foundation #5/#9 |
| 5 | Tema 3-mode (#1) | S | Polish brand |
| 6 | Índice búsqueda Cmd+K global (#4) | M | Feature poder-usuario |
| 7 | API keys + rate limiting (#8 + #9) | M | Prerequisito MCP |
| 8 | Servidor MCP (#5) | M–L | Diferenciador mayor |
| 9 | Email transaccional (#2) | M | Alcance notificación |
| 10 | Webhooks n8n (#7) | M | Ecosistema automatización |
| 11 | Puntuación repo health (#11) | M | Feature original |

---

## Preguntas Sin Resolver

1. **Alcance MCP** — exponer todos tools lectura GH, o también escritura (close issue, merge PR, comment)? Modelo auth escritura más heavy.
2. **maureldev multi-user** — modelo actual single-user-per-instance (self-host). ¿Queremos shared instance con accounts org/team (plugin `organization` Better Auth) antes agregar API keys?
3. **Proveedor email** — Resend (matches crmdev) vs SMTP-only self-hosted completo. Afecta #2.
4. **Profundidad integración n8n** — ship workflows ejemplo en repo, o solo documentar webhook contract?
5. **App desktop Tauri devdock** — ¿está cliente desktop nativo maureldev mesa? Cambiaría cálculo abstracción (revisar #15/#17).
6. **Stack telemetría** — Prometheus + Grafana en Dokploy, o OpenTelemetry → external? Opción gates diseño structured logging.
