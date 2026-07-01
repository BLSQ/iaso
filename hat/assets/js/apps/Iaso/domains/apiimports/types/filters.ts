import { PaginationParams } from 'Iaso/types/general';

export type Filters = {
    createdBy?: string;
    importType?: string;
    hasProblem?: boolean;
    appId?: string;
    appVersion?: string;
    fromDate?: string;
    toDate?: string;
    userId?: string;
};

export type Params = Filters & PaginationParams;
