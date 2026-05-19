# ODK Web Forms preview

Vue app in `docker/odk-preview`, embedded in Form AI.

## Development

Two dev servers:

```bash
# terminal 1 — odk-preview (Vite, port 8009)
cd docker/odk-preview
npm ci
npm run dev

# terminal 2 — IASO (webpack)
npm run dev
```

IASO loads `http://localhost:8009/src/mount.ts` from the Vite dev server (hot reload on Vue/CSS changes).

Do **not** set `ODK_PREVIEW_REMOTE_URL` for webpack dev.

## Production

Build the static bundle and commit it:

```bash
cd docker/odk-preview
npm ci
npm run build
git add iaso/static/odk-preview/
```

This writes `iaso/static/odk-preview/assets/remoteEntry.js`. Django serves it at `/static/odk-preview/…`.

Production webpack is built with `loadOdkPreviewRemote.prod.ts`, which loads that `remoteEntry.js` (default path `/static/odk-preview/assets/remoteEntry.js`, overridable via `ODK_PREVIEW_REMOTE_URL` at **webpack prod build** time).

No odk-preview dev server is required in production.
