import type { StyleSpecification } from '@vis.gl/react-maplibre';
import { Tile } from '../tools/TilesSwitchControl';

const BASEMAP_ID = 'basemap';

/**
 * A MapLibre style holding only the basemap, built from the same tile definitions as the leaflet maps
 * (`constants/mapTiles`), so basemaps stay defined in one place.
 *
 * Overlays are not part of the style: they are `<Source>`/`<Layer>` children of the map, which
 * react-maplibre re-adds whenever the style changes (e.g. when switching basemap).
 */
export const rasterBasemapStyle = (tile: Tile): StyleSpecification => ({
    version: 8,
    sources: {
        [BASEMAP_ID]: {
            type: 'raster',
            tiles: [tile.url],
            tileSize: 256,
            // past it MapLibre overzooms the last level instead of capping the map zoom like leaflet
            maxzoom: tile.maxZoom,
            attribution: tile.attribution,
        },
    },
    layers: [{ id: BASEMAP_ID, type: 'raster', source: BASEMAP_ID }],
});

/** Bluesquare's vector tile server: Protomaps basemap tiles, with their styles, fonts and icons */
export const PROTOMAPS_STYLES_URL = 'https://martin.bluesquare.org/styles';
export const PROTOMAPS_FLAVORS = [
    'light',
    'dark',
    'white',
    'grayscale',
    'black',
] as const;
export type ProtomapsFlavor = (typeof PROTOMAPS_FLAVORS)[number];

/** What a MapLibre map is drawn over: a Protomaps flavor, or one of the raster tiles of `constants/mapTiles` */
export type Basemap =
    | { kind: 'protomaps'; flavor: ProtomapsFlavor }
    | { kind: 'raster'; key: string };

export const DEFAULT_BASEMAP: Basemap = { kind: 'protomaps', flavor: 'light' };

/**
 * The map style of a basemap. A Protomaps flavor is a complete style served by the tile server (its tiles,
 * labels and icons), passed by url; a raster basemap is built here from its tile definition.
 */
export const basemapStyle = (
    basemap: Basemap,
    rasterTiles: Record<string, Tile>,
): StyleSpecification | string =>
    basemap.kind === 'protomaps'
        ? `${PROTOMAPS_STYLES_URL}/${basemap.flavor}.json`
        : rasterBasemapStyle(rasterTiles[basemap.key]);
