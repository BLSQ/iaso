import { describe, expect, it } from 'vitest';
import {
    anchorLayerId,
    anchorLayers,
    searchLayerId,
    searchResultsLayers,
} from './searchResultsLayers';

describe('searchResultsLayers', () => {
    it('draws every kind of feature of the tiles, each under its anchor', () => {
        const layers = searchResultsLayers('search-0', '#f00', true);
        expect(
            layers.map(layer => [layer.id, layer.type, layer.beforeId]),
        ).toEqual([
            ['search-0-fill', 'fill', anchorLayerId('fill')],
            ['search-0-line', 'line', anchorLayerId('line')],
            ['search-0-cluster', 'circle', anchorLayerId('cluster')],
            ['search-0-point', 'circle', anchorLayerId('point')],
        ]);
        layers.forEach(layer => {
            expect(layer['source-layer']).toBe('org_units');
        });
        expect(searchLayerId('search-0', 'point')).toBe('search-0-point');
    });

    it('anchors the kinds in drawing order: shapes, lines, clusters, points', () => {
        expect(anchorLayers().map(layer => layer.id)).toEqual(
            ['fill', 'line', 'cluster', 'point'].map(kind =>
                anchorLayerId(kind as never),
            ),
        );
    });

    it('sizes clusters by their count only when clustering', () => {
        const radius = (clusters: boolean) =>
            (
                searchResultsLayers('s', '#f00', clusters)[2].paint as Record<
                    string,
                    unknown
                >
            )['circle-radius'] as unknown[];
        expect(radius(true)[0]).toBe('step');
        expect(radius(false)[0]).toBe('interpolate');
    });
});
