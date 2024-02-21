/* eslint-disable camelcase */
import { Pagination, UrlParams } from 'bluesquare-components';

export type PotentialPaymentParams = UrlParams & {
    param?: string;
};

type PaymenStatus = 'pending' | 'sent' | 'rejected';

type User = {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
};

type OrgUnitChangeRequest = {
    id: number;
    uuid: string;
    org_unit_id: number;
};

export type Payment = {
    id: number;
    status: PaymenStatus;
    created_at: string;
    updated_at: string;
    created_by: User;
    updated_by: User;
    user: User;
    change_requests: OrgUnitChangeRequest[];
};

export type PotentialPayment = {
    id: number;
    status: string;
    user: User;
    change_requests: OrgUnitChangeRequest[];
};
export interface PotentialPaymentPaginated extends Pagination {
    results: PotentialPayment[];
}
