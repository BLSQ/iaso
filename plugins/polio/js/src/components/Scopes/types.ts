/* eslint-disable camelcase */

export type Scope = {
    vaccine: string;
    group: {
        org_units: number[];
        id?: number;
    };
};

export type Shape = {
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
};

export type ShapeRow = Shape & {
    region: string;
    vaccineName?: string;
    fullRegionIsPartOfScope?: boolean;
};

export type Round = {
    number: number;
    scopes: Scope[];
    originalIndex: number;
};
