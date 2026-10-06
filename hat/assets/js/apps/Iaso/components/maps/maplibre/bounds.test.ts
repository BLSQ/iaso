import { getGeoJsonBounds, unionBounds } from './bounds';

describe('getGeoJsonBounds', () => {
    it('returns the bounding box of a multipolygon', () => {
        expect(
            getGeoJsonBounds({
                type: 'MultiPolygon',
                coordinates: [
                    [
                        [
                            [1, 2],
                            [3, -4],
                            [5, 6],
                            [1, 2],
                        ],
                    ],
                    [
                        [
                            [-7, 0],
                            [0, 8],
                            [-7, 0],
                        ],
                    ],
                ],
            }),
        ).toEqual([
            [-7, -4],
            [5, 8],
        ]);
    });

    it('combines every feature of a collection, points included', () => {
        expect(
            getGeoJsonBounds({
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: { type: 'Point', coordinates: [10, 20] },
                    },
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [-1, 1],
                                [2, 2],
                            ],
                        },
                    },
                ],
            }),
        ).toEqual([
            [-1, 1],
            [10, 20],
        ]);
    });

    it('returns undefined without coordinates', () => {
        expect(
            getGeoJsonBounds({ type: 'FeatureCollection', features: [] }),
        ).toBeUndefined();
    });
});

describe('unionBounds', () => {
    it('is the box around all bounds, skipping the missing ones', () => {
        expect(
            unionBounds([
                [
                    [0, 0],
                    [1, 1],
                ],
                undefined,
                [
                    [-1, 0.5],
                    [0.5, 2],
                ],
            ]),
        ).toEqual([
            [-1, 0],
            [1, 2],
        ]);
        expect(unionBounds([undefined])).toBeUndefined();
    });
});
