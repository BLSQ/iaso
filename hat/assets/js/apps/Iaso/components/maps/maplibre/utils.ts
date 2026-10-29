import { GeoJSON, Position } from 'geojson';
import { LngLatBounds } from 'maplibre-gl';

const collectPositions = (geoJson: GeoJSON): Position[] => {
    switch (geoJson.type) {
        case 'FeatureCollection':
            return geoJson.features.flatMap(collectPositions);
        case 'Feature':
            return geoJson.geometry ? collectPositions(geoJson.geometry) : [];
        case 'GeometryCollection':
            return geoJson.geometries.flatMap(collectPositions);
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

export const getGeoJsonBounds = (
    geoJson: GeoJSON,
): LngLatBounds | undefined => {
    const positions = collectPositions(geoJson);
    if (!positions.length) return undefined;
    return positions.reduce(
        (bounds, [lng, lat]) => bounds.extend([lng, lat]),
        new LngLatBounds(),
    );
};
