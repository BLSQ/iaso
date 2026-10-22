import { FeatureCollection, MultiPolygon, Polygon } from 'geojson';

export type AssignableOrgUnit = {
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
    org_unit_type_id: number | null;
    geo_json: FeatureCollection<Polygon | MultiPolygon> | null;
};

export type Assignment = {
    id: number;
    org_unit: number;
    team: number | null;
    user: number | null;
};

export type OrgUnitFeatureProperties = {
    id: number;
    name: string;
};
