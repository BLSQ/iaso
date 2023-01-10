export type GeoJson = {
    type:
        | 'Point'
        | 'LineString'
        | 'MultiPoint'
        | 'Polygon'
        | 'MultiPolygon'
        | 'MultiLineString';
    features?: {
        id: number;
        type: string;
        geometry: {
            type: string;
            coordinates: Array<Array<[number, number]>>;
        };
        properties: Record<string, unknown>;
    }[];
    crs?: { type: string; properties: Record<string, unknown> };
    coordinates?: Array<number>;
};
