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
export type NestedUser = Partial<User>;

export type OrgUnitChangeRequestConfig = {
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

export interface OrgUnitChangeRequestConfigsPaginated extends Pagination {
    results: OrgUnitChangeRequestConfig[];
};
