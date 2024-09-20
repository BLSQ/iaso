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
    projectId?: number;
    orgUnitTypeId?: number;
    orgUnitsEditable?: boolean;
    editableFields?: Array<string>;
    possibleTypeIds?: Array<OrgUnitType>;
    possibleParentTypeIds?: Array<OrgUnitType>;
    groupSetIds?: Array<GroupSet>;
    editableReferenceFormIds?: Array<Form>;
    otherGroupIds?: Array<Group>;
};

export interface OrgUnitChangeRequestConfigsPaginated extends Pagination {
    results: OrgUnitChangeRequestConfigListElement[];
}

export interface CheckAvailiabilityOrgUnitRequestConfig {
    results: OrgUnitType[];
}
