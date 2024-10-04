import { ChronogramTask } from '../Chronogram/types';

export type ChronogramTasksParams = {
    chronogram_id: string;
    order?: string;
    page?: string;
    limit?: string; // API name for "number of results per page".
    pageSize?: string; // TableWithDeepLink name for "number of results per page".
    // Search params.
    period?: string;
    status?: string;
};

export type ChronogramTaskApiResponse = {
    count: number;
    results: ChronogramTask[];
    has_next: boolean;
    has_previous: boolean;
    page: number;
    pages: number;
    limit: number;
};
