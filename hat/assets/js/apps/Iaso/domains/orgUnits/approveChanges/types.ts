/* eslint-disable camelcase */
import { Pagination, UrlParams } from 'bluesquare-components';
import { User } from '../../../utils/usersUtils';

export type OrgUnitValidationStatus = 'new' | 'rejected' | 'approved';
export type ApproveOrgUnitParams = UrlParams & {
    parent_id?: string;
    groups?: string;
    org_unit_type_id?: string;
    status?: OrgUnitValidationStatus;
};
export type Group = {
    id: number;
    name: string;
};

type NestedUser = Partial<User>;

export type OrgUnitChangeRequest = {
    id: number;
    uuid: string;
    org_unit_id: number;
    org_unit_uuid: string;
    org_unit_name: string;
    org_unit_type_id: number;
    org_unit_type_name: string;
    status: OrgUnitValidationStatus;
    groups: Group[];
    requested_fields: string;
    approved_fields: string[];
    rejection_comment?: string;
    created_by: NestedUser;
    created_at: string;
    updated_by: NestedUser;
    updated_at: string;
};
export type ApproveChanges = Array<OrgUnitChangeRequest>;

export interface ApproveChangesPaginated extends Pagination {
    results: OrgUnitChangeRequest[];
}
