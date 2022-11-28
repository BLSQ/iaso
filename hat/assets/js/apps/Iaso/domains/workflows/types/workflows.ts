/* eslint-disable camelcase */
import { Pagination, UrlParams } from '../../../types/table';
import { EntityType } from '../../entities/entityTypes/types/entityType';

export type WorkflowParams = UrlParams & {
    entityTypeId: string;
    versionId: string;
};

export type WorkflowsParams = UrlParams & {
    entityTypeId: string;
    search: string;
    status: Status;
};

export type Status = 'DRAFT' | 'UNPUBLISHED' | 'PUBLISHED';

export type Change = {
    form: Form;
    mapping: Record<string, string>;
    created_at: number;
    updated_at: number;
};

type Form = {
    id: string;
    name: string;
};

export type FollowUps = {
    id: string;
    order: number;
    condition: Record<string, string>;
    forms: Form[];
    created_at: number;
    updated_at: number;
};

export type WorkflowDetail = {
    version_id: string;
    name: string;
    status: Status;
    entity_type: EntityType;
    reference_form: Form;
    created_at: number;
    updated_at: number;
    changes: Change[];
    follow_ups: FollowUps[];
};

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
