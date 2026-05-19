# ODK Web Forms preview (odk-preview)

Form AI embeds a Vue app from `docker/odk-preview`.

## Local development (no production build)

Development **does not** use `remoteEntry.js`. IASO imports `src/mount.ts` directly from the Vite dev server (true HMR).

```bash
# terminal 1
cd docker/odk-preview
npm ci
npm run dev

# terminal 2
npm run dev
```

Webpack logs: `[odk-preview] dev mount module → http://localhost:8009/src/mount.ts`

- **IASO**: webpack HMR
- **odk-preview**: Vite HMR on Vue/CSS; Form AI remounts on `odk-preview-updated`

Do not set `ODK_PREVIEW_REMOTE_URL` when running webpack dev.

## Production build (federation)

`remoteEntry.js` is only generated for production:

```bash
cd docker/odk-preview
npm run build
```

Output: `iaso/static/odk-preview/assets/remoteEntry.js`

Production webpack loads `/static/odk-preview/assets/remoteEntry.js` by default, or `ODK_PREVIEW_REMOTE_URL` at build time.

## Why two modes?

`@originjs/vite-plugin-federation` does not expose `remoteEntry.js` in plain `vite dev` (the URL returns `index.html`). So:

| Mode | odk-preview | IASO loads |
|------|-------------|------------|
| Dev | `npm run dev` (Vite) | `http://localhost:8009/src/mount.ts` |
| Prod | `npm run build` | `remoteEntry.js` from static |
