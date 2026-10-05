// Only the urls are imported here: the files are emitted as is by `maplibreRules` (bundle/maplibre.js)
import 'maplibre-gl/dist/maplibre-gl-shared.mjs?url';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

let mapLib: Promise<typeof import('maplibre-gl')> | undefined;

/**
 * `maplibre-gl`, set up for our bundle: once bundled it can't find the worker file it starts its web workers
 * from, so it is given its url (MapLibre's documented setup for bundlers). Pass it as `mapLib` to
 * react-maplibre's `<Map>`.
 *
 * "eager": kept in the main chunk for now. Our webpack `publicPath` is empty, so a lazy chunk would be
 * fetched relative to the page url - the reason asset urls are prefixed with `window.STATIC_URL` by hand.
 * Once the public path is set at runtime, dropping the comment moves MapLibre to its own lazy chunk.
 */
export const loadMapLib = (): Promise<typeof import('maplibre-gl')> => {
    mapLib ??= import(/* webpackMode: "eager" */ 'maplibre-gl').then(lib => {
        lib.setWorkerUrl(`${window.STATIC_URL ?? '/static/'}${workerUrl}`);
        return lib;
    });
    return mapLib;
};
