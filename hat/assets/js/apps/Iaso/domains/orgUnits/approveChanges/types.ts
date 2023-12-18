/* eslint-disable camelcase */
import { Pagination, UrlParams } from 'bluesquare-components';
import { User } from '../../../utils/usersUtils';
import { ShortOrgUnit } from '../types/orgUnit';
import { OrgunitType } from '../types/orgunitTypes';

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

export type NestedUser = Partial<User>;
export type NestedOrgUnitType = Partial<OrgunitType>;
export type NestedGroup = {
    id: number;
    name: string;
};

export type NestedLocation = {
    latitude: number;
    longitude: number;
    altitude: number;
};

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
export type OrgUnitChangeRequests = Array<OrgUnitChangeRequest>;

export interface OrgUnitChangeRequestsPaginated extends Pagination {
    results: OrgUnitChangeRequest[];
}

export type OrgUnitChangeRequestDetails = {
    id: number;
    uuid: string;
    status: 'new' | 'rejected' | 'approved';
    created_by: NestedUser;
    created_at: string;
    updated_by: NestedUser;
    updated_at: string;
    requested_fields: string;
    approved_fields: string[];
    rejection_comment?: string;
    org_unit: OrgUnitForChangeRequest;
    new_parent?: ShortOrgUnit;
    new_name?: string;
    new_org_unit_type: NestedOrgUnitType;
    new_groups: NestedGroup[];
    new_location?: NestedLocation;
    new_location_accuracy?: number;
    new_opening_date?: string;
    new_closed_date?: string;
    new_reference_instances: InstanceForChangeRequest[];
};

type OrgUnitForChangeRequest = {
    id: number;
    parent?: ShortOrgUnit;
    name: string;
    org_unit_type: NestedOrgUnitType;
    groups: NestedGroup[];
    location?: NestedLocation;
    opening_date?: string;
    closed_date?: string;
    reference_instances: InstanceForChangeRequest[];
};

export type InstanceForChangeRequest = {
    id: number;
    form_id: string;
    form_name: string;
    values: any;
};
