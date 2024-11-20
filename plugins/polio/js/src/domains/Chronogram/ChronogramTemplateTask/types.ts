import { User } from '../types';

export type ChronogramTemplateTaskParams = {
    order?: string;
    page?: string;
    limit?: string; // API name for "number of results per page".
    pageSize?: string; // TableWithDeepLink name for "number of results per page".
};

export type ChronogramTemplateTask = {
    // Default fields.
    id: number;
    account: number;
    period: string;
    get_period_display: string;
    description: string;
    description_en: string;
    description_fr: string;
    start_offset_in_days: number;
    // Optional fields.
    created_at?: string; // DateTime
    created_by?: User;
    updated_at?: string; // DateTime
    updated_by?: User;
};

export type ChronogramTemplateTaskApiResponse = {
    count: number;
    results: ChronogramTemplateTask[];
    has_next: boolean;
    has_previous: boolean;
    page: number;
    pages: number;
    limit: number;
};
