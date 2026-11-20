# Vite config modules

Entry point: `hat/vite.config.ts` (required by Vite/npm scripts).

| Path | Role |
|------|------|
| `context.ts` | Paths, `.env` load, bundle generators, dev server env |
| `define.ts` | Client `define` (Orval, formatjs locale, PDF worker URL in dev) |
| `resolve.ts` | `resolve.alias` / dedupe |
| `optimize-deps.ts` | `optimizeDeps` |
| `server.ts` | Dev server, HMR, polling |
| `build.ts` | Rollup build output |
| `django-stats/` | Stats file writers for `hat.frontend_bundles` |
| `plugins/` | Custom Vite plugins (Django stats, PDF worker, warmup, LIVE_COMPONENTS) |