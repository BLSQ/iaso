/* eslint-disable camelcase */

type SubOrgUnitType = {
    id: number;
    name: string;
    short_name: string | null;
    depth: number | null;
    created_at: number;
    updated_at: number;
};

type FeatureFlag = {
    id: number;
    name: string;
    code: string;
    description: string;
    created_at: number;
    updated_at: number;
};

type Project = {
    id: number;
    name: string;
    app_id: string | null;
    needs_authentication: boolean;
    created_at: number;
    updated_at: number;
    feature_flags: FeatureFlag[];
};

export type OrgunitType = {
    id: number;
    name: string;
    short_name: string | null;
    depth: number | null;
    created_at: number;
    updated_at: number;
    units_count: number;
    sub_unit_types: SubOrgUnitType[];
    reference_form: any;
    projects: Project[];
};

type OrgunitTypes = OrgunitType[];

export type OrgunitTypesApi = {
    orgUnitTypes: OrgunitTypes;
};
