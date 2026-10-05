import type {
    CircleLayerSpecification,
    FillLayerSpecification,
    LineLayerSpecification,
} from '@vis.gl/react-maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';

type GeometryLayer =
    | Omit<FillLayerSpecification, 'source'>
    | Omit<LineLayerSpecification, 'source'>
    | Omit<CircleLayerSpecification, 'source'>;

export type GeometryStyle = {
    color: string;
    fillOpacity?: number;
    lineWidth?: number;
};

type Options = GeometryStyle & {
    /** required for vector tile sources: the layer of the tile to draw */
    sourceLayer?: string;
};

const isGeometry = (...types: string[]): ExpressionSpecification => [
    'in',
    ['geometry-type'],
    ['literal', types],
];

/** Ids of the layers `geometryLayers(prefix)` makes, e.g. for `interactiveLayerIds` */
export const geometryLayerIds = (prefix: string) => ({
    fill: `${prefix}-fill`,
    line: `${prefix}-line`,
    circle: `${prefix}-circle`,
});

/**
 * One fill, one line and one circle layer: draws any mix of polygons, lines and points in a single color,
 * whatever the source (GeoJSON or vector tiles). Pass them to `<Layer>` inside the matching `<Source>`.
 */
export const geometryLayers = (
    prefix: string,
    { color, sourceLayer, fillOpacity = 0.2, lineWidth = 1.5 }: Options,
): GeometryLayer[] => {
    const ids = geometryLayerIds(prefix);
    const source = sourceLayer ? { 'source-layer': sourceLayer } : {};
    return [
        {
            id: ids.fill,
            type: 'fill',
            ...source,
            filter: isGeometry('Polygon', 'MultiPolygon'),
            paint: { 'fill-color': color, 'fill-opacity': fillOpacity },
        },
        {
            id: ids.line,
            type: 'line',
            ...source,
            filter: isGeometry(
                'Polygon',
                'MultiPolygon',
                'LineString',
                'MultiLineString',
            ),
            paint: { 'line-color': color, 'line-width': lineWidth },
        },
        {
            id: ids.circle,
            type: 'circle',
            ...source,
            filter: isGeometry('Point', 'MultiPoint'),
            paint: {
                'circle-color': color,
                'circle-radius': 5,
                'circle-stroke-color': 'white',
                'circle-stroke-width': 1,
            },
        },
    ];
};
