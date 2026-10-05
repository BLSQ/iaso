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
