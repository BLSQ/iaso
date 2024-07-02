/* eslint-disable camelcase */

export type ChronogramParams = {
    // API params.
    order?: string;
    page?: string;
    limit?: string; // API name for "number of results per page".
    pageSize?: string; // TableWithDeepLink name for "number of results per page".
    // Search params.
    country?: string;
    on_time?: string;
    search?: string;
};

export type DropdownOptions = {
    label: string;
    value: number | string;
};

export type ChronogramTaskMetaData = {
    period: DropdownOptions[];
    status: DropdownOptions[];
};

export type User = {
    id: number;
    username: string;
    full_name: string;
};

export type ChronogramTask = {
    // Default fields.
    id: number;
    chronogram: number;
    period: string;
    description: string;
    start_offset_in_days: number;
    deadline_date: string; // Date
    status: string;
    user_in_charge: User;
    delay_in_days: number;
    comment: string;
    // Optional fields.
    created_at?: string; // DateTime
    created_by?: User;
    updated_at?: string; // DateTime
    updated_by?: User;
};

export type Chronogram = {
    // Default fields.
    id: number;
    campaign_obr_name: string;
    round_number: string;
    round_start_date: string; // Date
    is_on_time: boolean;
    num_task_delayed: number;
    percentage_of_completion: {
        BEFORE: number;
        DURING: number;
        AFTER: number;
    };
    // Optional fields.
    tasks?: ChronogramTask[];
    created_at?: string; // DateTime
    created_by?: User;
    updated_at?: string; // DateTime
    updated_by?: User;
};

export type ChronogramApiResponse = {
    count: number;
    results: Chronogram[];
    has_next: boolean;
    has_previous: boolean;
    page: number;
    pages: number;
    limit: number;
};
