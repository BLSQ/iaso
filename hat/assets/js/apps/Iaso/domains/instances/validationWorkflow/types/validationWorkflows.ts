import { PaginatedResponse } from 'Iaso/domains/instances/validationWorkflow/types/common';

type ValidationWorkflowListResponseItem = {
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

type NestedNodeTemplate = {
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

export type ValidationWorkflowRetrieveResponseItem = {
    slug: string;
    name: string;
    description?: string;
    forms?: Array<{
        id: number;
        label?: string;
    }>;
    created_by?: string;
    updated_by?: string;
    created_at: string;
    updated_at: string;
    node_templates?: NestedNodeTemplate[];
};

export type ValidationWorkflowRetrieveResponseItemWithOrderedNodes = Omit<
    ValidationWorkflowRetrieveResponseItem,
    'node_templates'
> & {
    node_templates?: (NestedNodeTemplate & {
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
