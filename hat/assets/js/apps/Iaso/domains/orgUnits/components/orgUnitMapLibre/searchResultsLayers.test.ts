import { describe, expect, it } from 'vitest';
import {
    anchorLayerId,
    anchorLayers,
    searchLayerId,
    searchResultsLayers,
} from './searchResultsLayers';

describe('searchResultsLayers', () => {
    it('draws every kind of feature of the tiles, each under its anchor', () => {
        const layers = searchResultsLayers('search-0', {
            color: '#f00',
            clusters: true,
        });
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
                searchResultsLayers('s', { color: '#f00', clusters })[2]
                    .paint as Record<string, unknown>
            )['circle-radius'] as unknown[];
        expect(radius(true)[0]).toBe('step');
        expect(radius(false)[0]).toBe('interpolate');
    });

    it('applies the filter to every layer, on top of its own', () => {
        const hideTypes = [
            '!',
            ['in', ['get', 'org_unit_type_id'], ['literal', [42]]],
        ];
        const layers = searchResultsLayers('s', {
            color: '#f00',
            clusters: true,
            filter: hideTypes as never,
        });
        layers.forEach(layer => {
            const filter = layer.filter as unknown[];
            expect(filter[0]).toBe('all');
            expect(filter[2]).toEqual(hideTypes);
        });
    });

    it('sorts the shapes by their key, and the smaller clusters over the bigger ones', () => {
        const [fill, line, cluster] = searchResultsLayers('s', {
            color: '#f00',
            clusters: true,
            shapeSortKey: ['get', 'depth'],
        });
        expect(fill.layout).toEqual({ 'fill-sort-key': ['get', 'depth'] });
        expect(line.layout).toEqual({ 'line-sort-key': ['get', 'depth'] });
        expect(cluster.layout).toEqual({
            'circle-sort-key': ['-', 0, ['get', 'point_count']],
        });
    });
});
