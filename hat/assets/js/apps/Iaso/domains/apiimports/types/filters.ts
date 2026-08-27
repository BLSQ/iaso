type PaginationParams = {
    pageSize: number;
    order: string;
    page: number;
};

export type Filters = {
    importType?:
        | 'bulk'
        | 'instance'
        | 'orgUnit'
        | 'storageLog'
        | null
        | undefined;
    hasProblem?: boolean;
    appId?: string;
    appVersion?: string;
    fromDate?: string;
    toDate?: string;
    userId?: number;
};

export type Params = Filters & PaginationParams;
