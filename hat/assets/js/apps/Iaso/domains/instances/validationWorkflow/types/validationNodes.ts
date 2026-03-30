type History = {
    level: string;
    color: `#${string}`;
    created_at: number;
    updated_at: number;
    status: 'ACCEPTED' | 'REJECTED' | 'SKIPPED' | 'UNKNOWN';
    updated_by: string;
    created_by: string;
    comment?: string;
};
type NextTasks = {
    id: number;
    name: string;
    user_roles?: Array<{ id: number; name: string }>;
};
type NextByPass = {
    slug: string;
    name: string;
    user_roles?: Array<{ id: number; name: string }>;
};

export type ValidationNodeRetrieveResponse = {
    validation_status: string;
    rejection_comment?: string;
    history: Array<History>;
    next_tasks: Array<NextTasks>;
    next_bypass: Array<NextByPass>;
    workflow: string;
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
