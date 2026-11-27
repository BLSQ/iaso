import { Paginated } from 'bluesquare-components';

export type ValidationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ValidationQueue =
    | 'awaiting_my_action'
    | 'awaiting_others'
    | 'handled_by_me'
    | 'rejected';

export type ValidationWorkflowInstanceUser = {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
};

export type ValidationWorkflowInstanceCurrentStep = {
    id: number;
    node_template_id: number;
    name: string;
    position: number | null;
    pending_since: string;
    user_can_act: boolean;
};

export type ValidationWorkflowInstanceLastUserAction = {
    status: 'ACCEPTED' | 'REJECTED';
    name: string;
    position: number | null;
    date: string;
};

export type ValidationWorkflowInstanceListResponseItem = {
    id: number;
    display_name: string | null;
    org_unit: {
        id: number;
        name: string;
        parent: {
            id: number;
            name: string;
        } | null;
    } | null;
    form: {
        id: number;
        name: string;
    };
    workflow: {
        id: number;
        name: string;
    };
    project: {
        id: number;
        name: string;
        color: string;
    };
    // translated label of the status
    general_validation_status: string;
    validation_status: ValidationStatus | '';
    user_has_been_involved: boolean;
    requires_user_action: boolean;
    handled_by_me: boolean;
    last_updated: string | null;
    pending_since: string | null;
    submitted_by: ValidationWorkflowInstanceUser | null;
    submitted_at: string | null;
    is_resubmission: boolean;
    current_steps: ValidationWorkflowInstanceCurrentStep[];
    step_count: number | null;
    last_user_action: ValidationWorkflowInstanceLastUserAction | null;
};

export type ValidationWorkflowInstanceListResponse =
    Paginated<ValidationWorkflowInstanceListResponseItem>;

export type ValidationWorkflowInstanceCounts = Record<
    'all' | ValidationQueue,
    number
> & {
    oldest_pending_since: string | null;
};
