# Building the ODK Web Forms preview

The Form AI uses a Vue 3 application (`docker/odk-preview`) built with Vite and **Module Federation**. The React app loads `remoteEntry.js` at runtime (Vite `init` / `get` API) — no iframe. Webpack does not use `remotes:` because Vite and Webpack federation formats differ.

You only need to rebuild when updating `@getodk/web-forms` or changing the Vue app in `docker/odk-preview/`.

## Prerequisites

- Node.js ≥ 18
- npm

## Build

```bash
cd docker/odk-preview
npm ci
npm run build
```

Output is written to `iaso/static/odk-preview/` (including `assets/remoteEntry.js`). Commit the result:

```bash
git add iaso/static/odk-preview/
git commit -m "rebuild odk-preview bundle"
```

## Local development

### ODK preview remote (Vue)

```bash
cd docker/odk-preview
npm ci
npm run dev
```

Serves the federation remote at `http://localhost:8009/assets/remoteEntry.js`.

### IASO frontend (React host)

The webpack dev server loads the remote from port 8009 by default. Start both:

```bash
# terminal 1
cd docker/odk-preview && npm run dev

# terminal 2 (repo root)
npm run dev
```

Optional: use a path URL (webpack proxies `/static/odk-preview` to port 8009 while odk-preview dev is running):

```bash
ODK_PREVIEW_REMOTE_URL=/static/odk-preview/assets/remoteEntry.js npm run dev
```

Do **not** set `ODK_PREVIEW_REMOTE_URL` unless you need the path form above — the default `http://localhost:8009/assets/remoteEntry.js` is simplest.

## Updating `@getodk/web-forms`

```bash
cd docker/odk-preview
npm install @getodk/web-forms@latest
npm run build
git add package.json package-lock.json iaso/static/odk-preview/
git commit -m "update @getodk/web-forms to <version>"
```
