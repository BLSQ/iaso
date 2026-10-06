import type {
    BackgroundLayerSpecification,
    CircleLayerSpecification,
    FillLayerSpecification,
    LineLayerSpecification,
} from '@vis.gl/react-maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import { ORG_UNIT_TILES_SOURCE_LAYER } from './orgUnitTiles';

/** `POINT_COUNT_COLUMN` of iaso/api/v3/common/mvt.py: set on clusters only */
export const POINT_COUNT = 'point_count';
/** `TILE_META_LAYER`: only in the tiles cut at `MAX_TILE_FEATURES` */
export const TILE_META_SOURCE_LAYER = 'tile_meta';

/** What a search's layers draw: shapes under lines under points, whatever the order of the searches */
export const SEARCH_LAYER_KINDS = ['fill', 'line', 'cluster', 'point'] as const;
export type SearchLayerKind = (typeof SEARCH_LAYER_KINDS)[number];

type SearchLayer =
    | Omit<FillLayerSpecification, 'source'>
    | Omit<LineLayerSpecification, 'source'>
    | Omit<CircleLayerSpecification, 'source'>;

const isPolygon: ExpressionSpecification = [
    'match',
    ['geometry-type'],
    ['Polygon', 'MultiPolygon'],
    true,
    false,
];
const isCluster: ExpressionSpecification = ['has', POINT_COUNT];
const isHovered: ExpressionSpecification = [
    'boolean',
    ['feature-state', 'hover'],
    false,
];

export const searchLayerId = (sourceId: string, kind: SearchLayerKind) =>
    `${sourceId}-${kind}`;

/** Empty layers marking where each kind goes: a search's layers are added below the anchor of their kind */
export const anchorLayerId = (kind: SearchLayerKind) =>
    `search-results-anchor-${kind}`;

export const anchorLayers = (): BackgroundLayerSpecification[] =>
    SEARCH_LAYER_KINDS.map(kind => ({
        id: anchorLayerId(kind),
        type: 'background',
        layout: { visibility: 'none' },
    }));

/** Point radii by zoom (4, 10, 15), hovered or not */
const pointRadius = (hovered: number[], normal: number[]) => [
    'interpolate',
    ['linear'],
    ['zoom'],
    ...[4, 10, 15].flatMap((zoom, i) => [
        zoom,
        ['case', isHovered, hovered[i], normal[i]],
    ]),
];

/**
 * The layers of one search, in its color. Only circles, fills and lines: no symbol layer, so no label or icon
 * collision work and no glyphs to load. Clusters are sized by their count (shown on hover), points grow with
 * the zoom and drop their outline when small, so 30k of them stay a light, readable density map.
 */
export const searchResultsLayers = (
    sourceId: string,
    color: string,
    /** the tiles are clustered by more than a few pixels: else their clusters are only points a pixel apart */
    clusters: boolean,
): (SearchLayer & { beforeId: string })[] => {
    const common = (kind: SearchLayerKind) => ({
        id: searchLayerId(sourceId, kind),
        'source-layer': ORG_UNIT_TILES_SOURCE_LAYER,
        beforeId: anchorLayerId(kind),
    });
    return [
        {
            ...common('fill'),
            type: 'fill',
            filter: isPolygon,
            paint: {
                'fill-color': color,
                // light: a search often holds nested shapes (province, zones, areas), stacking up
                'fill-opacity': ['case', isHovered, 0.35, 0.08],
            },
        },
        {
            ...common('line'),
            type: 'line',
            filter: isPolygon,
            paint: {
                'line-color': color,
                'line-width': ['case', isHovered, 3, 1],
            },
        },
        {
            ...common('cluster'),
            type: 'circle',
            filter: isCluster,
            paint: {
                'circle-color': color,
                'circle-opacity': clusters ? 0.75 : 1,
                'circle-radius': clusters
                    ? [
                          'step',
                          ['get', POINT_COUNT],
                          8,
                          10,
                          11,
                          100,
                          15,
                          1000,
                          20,
                      ]
                    : // a few points less than a pixel apart: a point, a bit darker
                      (pointRadius(
                          [2, 4, 6],
                          [2, 4, 6],
                      ) as ExpressionSpecification),
                'circle-stroke-color': 'white',
                'circle-stroke-width': clusters ? 1.5 : 0,
            },
        },
        {
            ...common('point'),
            type: 'circle',
            filter: [
                'all',
                ['==', ['geometry-type'], 'Point'],
                ['!', isCluster],
            ],
            paint: {
                'circle-color': color,
                'circle-radius': pointRadius(
                    [5, 8, 10],
                    [2, 4, 6],
                ) as ExpressionSpecification,
                'circle-stroke-color': ['case', isHovered, '#222', 'white'],
                'circle-stroke-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    6,
                    0,
                    9,
                    1,
                ],
            },
        },
    ];
};
