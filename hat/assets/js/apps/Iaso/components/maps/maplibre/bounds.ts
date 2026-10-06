import type { GeoJSON, Position } from 'geojson';

/** `[[west, south], [east, north]]`, as taken by MapLibre's `fitBounds` and `initialViewState.bounds` */
export type Bounds = [[number, number], [number, number]];

const positions = (geoJson: GeoJSON): Position[] => {
    switch (geoJson.type) {
        case 'FeatureCollection':
            return geoJson.features.flatMap(positions);
        case 'Feature':
            return geoJson.geometry ? positions(geoJson.geometry) : [];
        case 'GeometryCollection':
            return geoJson.geometries.flatMap(positions);
        case 'Point':
            return [geoJson.coordinates];
        case 'MultiPoint':
        case 'LineString':
            return geoJson.coordinates;
        case 'MultiLineString':
        case 'Polygon':
            return geoJson.coordinates.flat();
        case 'MultiPolygon':
            return geoJson.coordinates.flat(2);
        default:
            return [];
    }
};

/** Bounding box of any GeoJSON object, `undefined` when it has no coordinates. */
export const getGeoJsonBounds = (geoJson: GeoJSON): Bounds | undefined => {
    const coordinates = positions(geoJson);
    if (coordinates.length === 0) {
        return undefined;
    }
    const lngs = coordinates.map(([lng]) => lng);
    const lats = coordinates.map(([, lat]) => lat);
    return [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
    ];
};

/** The box around all `bounds`, `undefined` when there are none */
export const unionBounds = (
    bounds: (Bounds | undefined)[],
): Bounds | undefined => {
    const boxes = bounds.filter((box): box is Bounds => box !== undefined);
    if (boxes.length === 0) {
        return undefined;
    }
    return [
        [
            Math.min(...boxes.map(box => box[0][0])),
            Math.min(...boxes.map(box => box[0][1])),
        ],
        [
            Math.max(...boxes.map(box => box[1][0])),
            Math.max(...boxes.map(box => box[1][1])),
        ],
    ];
};
