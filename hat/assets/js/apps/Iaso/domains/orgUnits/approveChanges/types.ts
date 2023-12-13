import { Pagination } from 'bluesquare-components';
import { OrgUnitStatus } from '../types/orgUnit';

export type ApproveOrgUnitParams = {
    parent_id?: string;
    groups?: string;
    org_unit_type_id?: string;
    status?: OrgUnitStatus;
};
export type ApproveChange = {
    id: number;
};
export type ApproveChanges = Array<ApproveChange>;

export interface ApproveChangesPaginated extends Pagination {
    results: ApproveChange;
}
