import { PaginatedResponse } from 'Iaso/domains/instances/validationWorkflow/types/common';

export type ValidationNodeTemplateListResponseItem = {
    slug: string;
    name: string;
    description?: string;
    color: `#${string}`;
    role_required?: Array<{ name: string; id: number }>;
    can_skip_previous_nodes: boolean;
};

export type ValidationNodeTemplateListResponse =
    PaginatedResponse<ValidationNodeTemplateListResponseItem>;

export type ValidationNodeTemplateCreateBody = {
    name: string;
    color?: `#${string}`;
    description?: string;
    roles_required?: number[];
    position?: 'last' | 'child_of' | 'first';
    parent_node_templates?: string[];
    can_skip_previous_nodes: boolean;
};

export type ValidationNodeTemplateUpdateBody = {
    name: string;
    description?: string;
    color?: `#${string}`;
    roles_required?: number[];
    can_skip_previous_nodes: boolean;
};

export type ValidationNodeTemplateRetrieveResponse = {
    slug: string;
    name: string;
    description?: string;
    color: `#${string}`;
    roles_required?: Array<{ name: string; id: number }>;
    can_skip_previous_nodes: true;
};

export type ValidationNodeTemplateBulkUpdateBody =
    Array<ValidationNodeTemplateUpdateBody>;
