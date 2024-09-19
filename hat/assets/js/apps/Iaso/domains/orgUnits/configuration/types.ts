import { Pagination, UrlParams } from 'bluesquare-components';
import { User } from '../../../utils/usersUtils';

export type OrgUnitChangeRequestConfigsParams = UrlParams & {
    org_unit_type_id?: string;
    project_id?: string;
};

export type Project = {
    id: number;
    name: string;
};

export type OrgUnitType = {
    id: number;
    name: string;
};

export type GroupSet = {
    id: number;
    name: string;
};

export type Form = {
    id: number;
    name: string;
};

export type Group = {
    id: number;
    name: string;
};

export type NestedUser = Partial<User>;

export type OrgUnitChangeRequestConfigListElement = {
    id: number;
    project: Project;
    org_unit_type: OrgUnitType;
    org_units_editable: boolean;
    editable_fields: Array<string>;
    created_by: NestedUser;
    created_at: number;
    updated_by: NestedUser;
    updated_at: number;
};

export type OrgUnitChangeRequestConfigurationFull = {
    id?: number;
    project?: Project;
    org_unit_type?: OrgUnitType;
    org_units_editable?: boolean;
    editable_fields?: Array<string>;
    possible_types?: Array<OrgUnitType>;
    possible_parent_types?: Array<OrgUnitType>;
    group_sets?: Array<GroupSet>;
    editable_reference_forms?: Array<Form>;
    other_groups?: Array<Group>;
    created_by?: NestedUser;
    created_at?: number;
    updated_by?: NestedUser;
    updated_at?: number;
};

export type OrgUnitChangeRequestConfigurationCreate = {
    project_id: number;
    org_unit_type_id: number;
    org_units_editable?: boolean;
    editable_fields?: Array<number>;
    possible_type_ids?: Array<number>;
    possible_parent_type_ids?: Array<number>;
    group_set_ids?: Array<number>;
    editable_reference_form_ids?: Array<number>;
    other_group_ids?: Array<number>;
};

export type OrgUnitChangeRequestConfigurationUpdate = {
    org_units_editable?: boolean;
    editable_fields?: Array<number>;
    possible_type_ids?: Array<number>;
    possible_parent_type_ids?: Array<number>;
    group_set_ids?: Array<number>;
    editable_reference_form_ids?: Array<number>;
    other_group_ids?: Array<number>;
};

export interface OrgUnitChangeRequestConfigsPaginated extends Pagination {
    results: OrgUnitChangeRequestConfigListElement[];
}

export interface CheckAvailiabilityOrgUnitRequestConfig {
    results: OrgUnitType[];
}
