/* eslint-disable camelcase */
import { OrgUnit } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';

export type Scope = {
    vaccine: string;
    group: {
        org_units: number[];
        id?: number;
    };
};

export type Shape = OrgUnit & {
    name: string;
    id: number;
    parent_id: number;
    country_parent?: { id: number };
    root?: { id: number };
};

export type Values = {
    scopes?: Scope[];
    org_unit: Shape;
    initial_org_unit: number;
};

export type FilteredDistricts = {
    name: string;
    vaccineName?: string;
    region: any;
    id: number;
    parent_id: number;
    latitude?: number;
    longitude?: number;
    geo_json?: Shape | undefined;
    has_geo_json: boolean;
};

export type ShapeRow = Shape & {
    region: string;
    vaccineName?: string;
    name: string;
    fullRegionIsPartOfScope?: boolean;
    latitude?: number;
    longitude?: number;
    geo_json?: Shape | undefined;
    has_geo_json: boolean;
};

export type Round = {
    number: number;
    scopes: Scope[];
    originalIndex: number;
};
