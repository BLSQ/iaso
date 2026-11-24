export type ValidationNodeTemplateCreateBody = {
    name: string;
    description?: string;
    roles_required?: number[];
    position?: 'last' | 'child_of' | 'first';
    parent_node_templates?: string[];
    can_skip_previous_nodes: boolean;
};

export type ValidationNodeTemplateUpdateBody = {
    name: string;
    description?: string;
    roles_required?: number[];
    can_skip_previous_nodes?: boolean;
};
