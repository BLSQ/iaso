import { Pagination, UrlParams } from 'bluesquare-components';
import { User } from '../../../utils/usersUtils';

export type OrgUnitChangeRequestConfigsParams = UrlParams & {
    type?: string;
    org_unit_type_id?: string;
    project_id?: string;
};

export type Project = {
    id: number;
    name: string;
};

export type OrgUnitTypeDropdownOption = {
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

export type GroupDropdownOption = {
    id: number;
    name: string;
    label?: string;
};

export type NestedUser = Partial<User>;

export type OrgUnitChangeRequestConfigListElement = {
    id: number;
    project: Project;
    Type: string;
    org_unit_type: OrgUnitTypeDropdownOption;
    org_units_editable: boolean;
    editable_fields: Array<string>;
    created_by: NestedUser;
    created_at: number;
    updated_by: NestedUser;
    updated_at: number;
};

export type OrgUnitChangeRequestConfigurationFull = {
    id: number;
    project: Project;
    type: string;
    org_unit_type: OrgUnitTypeDropdownOption;
    org_units_editable?: boolean;
    editable_fields?: string[];
    possible_types?: Array<OrgUnitTypeDropdownOption>;
    possible_parent_types?: Array<OrgUnitTypeDropdownOption>;
    group_sets?: Array<GroupSet>;
    editable_reference_forms?: Array<Form>;
    other_groups?: Array<GroupDropdownOption>;
};

export type OrgUnitChangeRequestConfigurationForm = {
    projectId: number;
    type: string;
    orgUnitTypeId: number;
    orgUnitsEditable?: boolean;
    editableFields?: string;
    possibleTypeIds?: string;
    possibleParentTypeIds?: string;
    groupSetIds?: string;
    editableReferenceFormIds?: string;
    otherGroupIds?: string;
};

export type OrgUnitChangeRequestConfiguration = {
    id?: number;
    project: Project;
    type: string;
    orgUnitType: OrgUnitTypeDropdownOption;
};

export interface OrgUnitChangeRequestConfigsPaginated extends Pagination {
    results: OrgUnitChangeRequestConfigListElement[];
}
