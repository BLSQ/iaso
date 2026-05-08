export type History = {
    id: number;
    level: string;
    color: `#${string}`;
    created_at: string;
    updated_at: string;
    status:
        | 'ACCEPTED'
        | 'REJECTED'
        | 'SKIPPED'
        | 'UNKNOWN'
        | 'NEW_VERSION'
        | 'SUBMISSION';
    updated_by: string;
    created_by: string;
    comment?: string;
    node_template_slug: string;
};
export type NextTasks = {
    id: number;
    name: string;
    node_template_slug: string;
    user_roles?: Array<{ id: number; name: string }>;
};
export type NextByPass = {
    slug: string;
    name: string;
    user_roles?: Array<{ id: number; name: string }>;
};

export type Timeline = {
    id: number;
    name: string;
    node_template_slug: string;
    comment?: string;
    updated_at: string;
    created_at: string;
    status?:
        | 'ACCEPTED'
        | 'UNKNOWN'
        | 'REJECTED'
        | 'SKIPPED'
        | 'NEW_VERSION'
        | 'SUBMISSION';
    updated_by?: string;
    type: 'NEXT_BYPASS' | 'TIMELINE';
    user_can_do_actions: boolean;
};

export type ValidationNodeRetrieveResponseSubmission = {
    created_at: string;
    created_by: string;
    next_created_at?: string;
    general_validation_status: 'APPROVED' | 'REJECTED' | 'PENDING';
    active_steps: number;
    timeline: Timeline[];
};

export type ValidationNodeRetrieveResponse = {
    workflow: string;
    total_steps: number;
    validation_status: 'APPROVED' | 'REJECTED' | 'PENDING';
    submissions?: ValidationNodeRetrieveResponseSubmission[];
};

export type ValidationNodeCompleteBody = {
    comment?: string;
    approved?: boolean;
};

export type ValidationNodeCompleteByPassBody = {
    node: string;
    comment?: string;
    approved?: boolean;
};
