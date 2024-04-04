/* eslint-disable camelcase */
import { OrgUnit } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { Scope } from '../../../../constants/types';

export type Shape = OrgUnit & {
    name: string;
    id: number;
    parent_id: number;
    country_parent?: { id: number };
    root?: { id: number };
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
    scope?: Scope;
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
