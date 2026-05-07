# Fase 02 — Mover gráfico de Contributions debajo de KPIs

## Contexto

Hoy en `dashboard/page.tsx`:

```
PageHeader
Metrics (KPIs)
[ RecentRepos | Activity ]   (grid 2:1)
ContributionsSection         (full width)
```

Pedido: Contributions justo debajo de KPIs.

## Layout objetivo

```
PageHeader
Metrics (KPIs)
ContributionsSection
[ RecentRepos | Activity ]
```

## Archivos

- `src/app/(dashboard)/dashboard/page.tsx`

## Pasos

1. Mover bloque `<Suspense fallback={<ContributionsSkeleton />}><ContributionsSection .../></Suspense>` justo después del `<Suspense>` de Metrics.
2. Mantener grid de RecentRepos + Activity como segundo bloque.

## Todo

- [ ] Reordenar JSX en `page.tsx`

## Criterio éxito

- Visual: KPIs → gráfico → (recents | activity).

## Riesgos

Ninguno.

## Siguiente

Fase 03.
