# Building the ODK Web Forms preview

The Form Copilot uses a small standalone Vue 3 application to render live ODK form previews. It is built with Vite and its compiled output is committed to `iaso/static/odk-preview/` so it is served directly by Django as static files — no separate service is required.

You only need to rebuild it when updating `@getodk/web-forms` or making changes to the Vue app source in `docker/odk-preview/`.

## Prerequisites

- Node.js ≥ 18
- npm

## Build

```bash
cd docker/odk-preview
npm ci
npm run build
```

The build writes its output to `iaso/static/odk-preview/` (configured in `vite.config.js`). Commit the result:

```bash
git add iaso/static/odk-preview/
git commit -m "rebuild odk-preview bundle"
```

## Run locally (dev server)

During development of the Vue app itself you can run the Vite dev server instead of rebuilding on every change:

```bash
cd docker/odk-preview
npm ci
npm run dev
```

The dev server starts on port 8009. To point the Form Copilot iframe at it instead of the committed static bundle, temporarily change `ODK_PREVIEW_BASE` in `hat/assets/js/apps/Iaso/domains/formCopilot/components/FormPreview.tsx`:

```ts
const ODK_PREVIEW_BASE = 'http://localhost:8009/';
```

Remember to revert this change before committing.

## Updating `@getodk/web-forms`

`package.json` currently pins `@getodk/web-forms` to `latest`. To update:

```bash
cd docker/odk-preview
npm install @getodk/web-forms@latest
npm run build
git add package.json package-lock.json iaso/static/odk-preview/
git commit -m "update @getodk/web-forms to <version>"
```
