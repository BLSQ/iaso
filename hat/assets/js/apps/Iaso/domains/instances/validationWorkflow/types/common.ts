export type PaginatedResponse<T> = {
    count: number;
    has_next: boolean;
    has_previous: boolean;
    page: number;
    pages: number;
    limit: number;
    results: T[];
};
