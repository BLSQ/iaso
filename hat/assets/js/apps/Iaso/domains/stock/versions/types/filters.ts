import { Status } from 'Iaso/domains/stock/types/stocks';

export type Filters = {
    versionId?: number;
    search?: string;
    status?: Status;
    skuId?: number;
    formId?: number;
};

export type Params = Filters & {
    order: string;
    page: string;
    pageSize: string;
    tab: string;
};
