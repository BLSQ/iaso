import { ReactNode } from 'react';
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
    creator: Record<string, any>;
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
type FormState<T> = {
    value?: T;
    errors?: string[];
};
type FormStateRequired<T> = {
    value: T;
    errors?: string[];
};

export type OrgUnitState = {
    id: FormStateRequired<number>;
    name: FormStateRequired<string>;
    org_unit_type_id: FormStateRequired<string>;
    groups: FormState<number[]>;
    sub_source: FormState<string>;
    validation_status: FormState<string>;
    aliases: FormState<string>;
    source_id: FormState<number>;
    source: FormState<string>;
    parent: FormState<OrgUnit>;
    source_ref: FormState<string>;
    creator: FormStateRequired<Record<string, any>>;
    reference_instance_id: FormState<number>;
};

export type OrgUnitType = {
    id: number;
    name: string;
};
export type Group = {
    id: number;
    name: string;
};

export type Action = {
    id: string;
    icon: ReactNode;
    disabled?: boolean;
};

export type ActionsType = Action[];
