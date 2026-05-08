import { Paginated } from 'bluesquare-components';

export type ValidationWorkflowInstanceListResponseItem = {
    id: number;
    form: {
        id: number;
        name: string;
    };
    project: {
        id: number;
        name: string;
        color: string;
    };
    general_validation_status: 'PENDING' | 'APPROVED' | 'REJECTED';
    user_has_been_involved: boolean;
    requires_user_action: boolean;
    last_updated: string;
};

export type ValidationWorkflowInstanceListResponse =
    Paginated<ValidationWorkflowInstanceListResponseItem>;
