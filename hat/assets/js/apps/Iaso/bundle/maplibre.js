const { version } = require('maplibre-gl/package.json');

// MapLibre starts its web workers from `maplibre-gl-worker.mjs`, which imports `./maplibre-gl-shared.mjs`.
// `import url from 'maplibre-gl/dist/<file>?url'` (see components/maps/maplibre/mapLib.ts) emits both
// as is - not bundled, side by side, under their own names - and gives their url to `setWorkerUrl()`.
// Same idea as MapLibre's own webpack example, which copies them with copy-webpack-plugin.
/** @type {import('webpack').RuleSetRule} */
const maplibreWorkerRule = {
    test: /maplibre-gl[\\/]dist[\\/]maplibre-gl-(worker|shared)\.mjs$/,
    resourceQuery: /url/,
    type: 'asset/resource',
    // `maplibre-gl` only declares its css as side effects: keeps the unused shared url import
    sideEffects: true,
    generator: { filename: `maplibre-gl-${version}/[name][ext]` },
};

// MapLibre's own worker url detection - `new URL(`./${file}`, import.meta.url)` - can't work once bundled
// (we call `setWorkerUrl()` instead), but would make webpack bundle every file of `dist/` as a lazy context.
/** @type {import('webpack').RuleSetRule} */
const maplibreMainRule = {
    test: /maplibre-gl[\\/]dist[\\/]maplibre-gl\.mjs$/,
    parser: { url: false },
};

module.exports = { maplibreRules: [maplibreWorkerRule, maplibreMainRule] };
