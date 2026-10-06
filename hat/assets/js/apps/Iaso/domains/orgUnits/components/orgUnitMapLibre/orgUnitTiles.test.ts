import { orgUnitTileJSONUrl, tileJSONBounds, TileJSON } from './orgUnitTiles';

describe('orgUnitTileJSONUrl', () => {
    it('passes the filters on as query params', () => {
        expect(
            orgUnitTileJSONUrl({
                parent_id: 12,
                fields: 'name,validation_status',
            }),
        ).toBe(
            '/api/v3/orgunits/tilejson/?parent_id=12&fields=name,validation_status',
        );
    });

    it('drops undefined filters', () => {
        expect(orgUnitTileJSONUrl({ version_id: undefined })).toBe(
            '/api/v3/orgunits/tilejson/',
        );
    });
});

describe('tileJSONBounds', () => {
    const tileJSON: TileJSON = {
        tilejson: '3.0.0',
        tiles: [],
        minzoom: 0,
        maxzoom: 18,
        vector_layers: [],
    };

    it('turns TileJSON bounds into MapLibre bounds', () => {
        expect(tileJSONBounds({ ...tileJSON, bounds: [1, 2, 3, 4] })).toEqual([
            [1, 2],
            [3, 4],
        ]);
    });

    it('is undefined when nothing is located', () => {
        expect(tileJSONBounds(tileJSON)).toBeUndefined();
    });
});
