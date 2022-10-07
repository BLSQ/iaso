type PaginatedResponseParams<T> = {
    hasPrevious?: boolean;
    hasNext?: boolean;
    count?: number;
    page?: number;
    pages?: number;
    limit?: number;
    dataKey: string;
    data?: T[];
};

export const makePaginatedResponse = <T>({
    hasPrevious = false,
    hasNext = false,
    count = 0,
    page = 1,
    pages = 1,
    limit = 10,
    dataKey,
    data = [],
}: PaginatedResponseParams<T>): any => {
    return {
        has_previous: hasPrevious,
        has_next: hasNext,
        count,
        page,
        pages,
        limit,
        [dataKey]: data,
    };
};

export const pageOneTemplate = {
    hasPrevious: false,
    hasNext: true,
    page: 1,
    pages: 2,
    limit: 10,
    count: 15,
};
export const pageTwoTemplate = {
    hasPrevious: true,
    hasNext: false,
    page: 2,
    pages: 2,
    limit: 10,
    count: 15,
};
