/* eslint-disable camelcase */
import { Pagination, UrlParams } from '../../../types/table';

export type WorkflowsParams = UrlParams & {
    entityTypeId: string;
    name: string;
    status: Status;
};

export type Status = 'DRAFT' | 'UNPUBLISHED' | 'PUBLISHED';

export type Workflow = {
    version_id: string;
    name: string;
    status: Status;
    created_at: number;
    updated_at: number;
};
export type Workflows = Array<Workflow>;

export interface WorkflowsPaginated extends Pagination {
    results: Workflows;
}
