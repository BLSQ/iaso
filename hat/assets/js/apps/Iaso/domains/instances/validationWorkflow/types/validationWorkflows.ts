import { ValidationWorkflowRetrieve } from 'Iaso/api/validationWorkflows';
import { PaginatedResponse } from 'Iaso/domains/instances/validationWorkflow/types/common';

export type ValidationWorkflowListResponseItem = {
    slug: string;
    name: string;
    form_count: number;
    created_by?: string;
    updated_by?: string;
    created_at: string;
    updated_at: string;
};

export type ValidationWorkflowListResponse =
    PaginatedResponse<ValidationWorkflowListResponseItem>;

export type NestedNodeTemplate = {
    slug: string;
    name: string;
    description?: string;
    color: `#${string}`;
    roles_required?: Array<{
        name: string;
        id: number;
    }>;
    can_skip_previous_nodes: boolean;
};

export type ValidationWorkflowRetrieveResponseItemWithOrderedNodes = Omit<
    ValidationWorkflowRetrieve,
    'node_templates'
> & {
    node_templates?: (Pick<ValidationWorkflowRetrieve, 'node_templates'> & {
        id: number;
        order: number;
    })[];
};

export type ValidationWorkflowListDropdownResponse = Array<{
    value: number;
    label: string;
}>;

export type ValidationWorkflowCreateBody = {
    name: string;
    description?: string;
    forms?: number[];
};

export type ValidationWorkflowPatchBody = {
    name?: string;
    description?: string;
    forms?: number[];
};
