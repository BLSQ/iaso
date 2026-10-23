import { getGeoJsonBounds } from './utils';

describe('getGeoJsonBounds', () => {
    it('returns the bounds of every position in a feature collection', () => {
        const bounds = getGeoJsonBounds({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [1, 2],
                                    [3, 4],
                                    [1, 2],
                                ],
                            ],
                            [
                                [
                                    [-5, 10],
                                    [0, 0],
                                    [-5, 10],
                                ],
                            ],
                        ],
                    },
                },
            ],
        });
        expect(bounds?.toArray()).toEqual([
            [-5, 0],
            [3, 10],
        ]);
    });

    it('returns undefined when there is no position', () => {
        expect(
            getGeoJsonBounds({ type: 'FeatureCollection', features: [] }),
        ).toBeUndefined();
    });
});
