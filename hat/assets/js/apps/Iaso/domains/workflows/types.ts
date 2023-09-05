/* eslint-disable camelcase */
import { Pagination, UrlParams } from 'bluesquare-components';
import { EntityType } from '../entities/entityTypes/types/entityType';
import { FieldType } from '../forms/types/forms';

export type WorkflowParams = UrlParams & {
    entityTypeId: string;
    versionId: string;
    order?: string;
};

export type WorkflowsParams = UrlParams & {
    entityTypeId: string;
    search: string;
    status: Status;
};

export type Status = 'DRAFT' | 'UNPUBLISHED' | 'PUBLISHED';

export type Mapping = {
    source: string | undefined;
    target: string | undefined;
};

export type Change = {
    id: number;
    form: ReferenceForm;
    mapping: Record<string, string>;
    created_at: string;
    updated_at: string;
};

export type ReferenceForm = {
    id: number;
    name: string;
};

export type FollowUps = {
    id: string;
    order: number;
    condition: Record<string, string>;
    forms: ReferenceForm[];
    created_at?: string;
    updated_at?: string;
};

export type WorkflowVersionDetail = {
    version_id: string;
    name: string;
    status: Status;
    entity_type: EntityType;
    reference_form: ReferenceForm;
    created_at: string;
    updated_at: string;
    follow_ups: FollowUps[];
};

export type WorkflowVersion = {
    version_id: string;
    name: string;
    status: Status;
    created_at: string;
    updated_at: string;
};
export type WorkflowVersions = Array<WorkflowVersion>;

export interface WorkflowVersionsPaginated extends Pagination {
    workflow_versions: WorkflowVersions;
}
export type ChangesOption = {
    label: string;
    value: string | number;
    type: FieldType;
};
