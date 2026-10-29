import { StyleSpecification } from 'maplibre-gl';
import { Tile } from '../tools/TilesSwitchControl';

export const BASEMAP_SOURCE_ID = 'basemap';

export const getRasterStyle = (tile: Tile): StyleSpecification => ({
    version: 8,
    sources: {
        [BASEMAP_SOURCE_ID]: {
            type: 'raster',
            tiles: [tile.url],
            tileSize: 256,
            maxzoom: tile.maxZoom,
            attribution: tile.attribution,
        },
    },
    layers: [
        {
            id: BASEMAP_SOURCE_ID,
            type: 'raster',
            source: BASEMAP_SOURCE_ID,
        },
    ],
});
