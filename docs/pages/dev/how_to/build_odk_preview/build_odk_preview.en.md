# ODK Web Forms preview

Vue app in `docker/odk-preview`, embedded in Form AI.

## Development

```bash
cd docker/odk-preview && npm ci && npm run dev   # port 8009
npm run dev                                       # IASO webpack
```

Dev loads `http://localhost:8009/src/mount.ts` (Vite HMR). Do not set `ODK_PREVIEW_REMOTE_URL`.

`index.html` + `App.vue` remain for standalone iframe testing with `postMessage`.

## Production

```bash
cd docker/odk-preview && npm run build
```

Writes `iaso/static/odk-preview/assets/remoteEntry.js`. Commit when shipping.

Webpack prod uses `/static/odk-preview/assets/remoteEntry.js`, or `ODK_PREVIEW_REMOTE_URL` at build time.
