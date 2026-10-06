import { describe, expect, it } from 'vitest';
import { basemapStyle, DEFAULT_BASEMAP } from './basemaps';

const tiles = {
    osm: { maxZoom: 18, url: 'https://tile.example/{z}/{x}/{y}.png' },
};

describe('basemapStyle', () => {
    it('defaults to the light Protomaps style of the tile server', () => {
        expect(basemapStyle(DEFAULT_BASEMAP, tiles)).toBe(
            'https://martin.bluesquare.org/styles/light.json',
        );
        expect(basemapStyle({ kind: 'protomaps', flavor: 'dark' }, tiles)).toBe(
            'https://martin.bluesquare.org/styles/dark.json',
        );
    });

    it('builds a style for a raster basemap', () => {
        const style = basemapStyle({ kind: 'raster', key: 'osm' }, tiles);
        expect(typeof style).toBe('object');
        expect(style).toMatchObject({
            sources: { basemap: { type: 'raster', tiles: [tiles.osm.url] } },
        });
    });
});
