import { UrlParams } from '../../../types/table';
import { Shape } from './shapes';
import { Nullable } from '../../../types/utils';

/* eslint-disable camelcase */
export type ShortOrgUnit = {
    name: string;
    id: number;
};

export type OrgUnit = {
    name: string;
    short_name: string;
    id: number;
    sub_source: string;
    sub_source_id: string | undefined;
    source_ref: string;
    source_url: null;
    parent_id: number;
    validation_status: string;
    parent_name: string;
    parent: OrgUnit;
    org_unit_type_id: number;
    created_at: number;
    updated_at: number;
    aliases?: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    geo_json?: Shape | undefined;
    has_geo_json: boolean;
    org_unit_type_name: string;
    source: string;
    source_id: number;
    version: number;
    groups: Array<(unknown & { id: number }) | number>;
    org_unit_type: string;
    search_index?: number;
    reference_instance_id: Nullable<number>;
};

export type OrgUnitParams = UrlParams & {
    locationLimit: string;
    tab?: string;
    searchTabIndex: string;
    searchActive?: string;
    searches: string;
    pageSize?: string;
};

export type OrgUnitsApi = {
    orgunits: OrgUnit[];
};
