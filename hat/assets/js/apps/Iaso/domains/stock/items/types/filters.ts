import { Impact } from 'Iaso/domains/stock/types/stocks';

export type Filters = {
    id?: number;
    sku?: number;
    orgUnit?: number;
    value?: number;
    question?: string;
    impact?: Impact;
    created_at_after?: string;
    created_at_before?: string;
    value_from?: number;
    value_to?: number;
};

export type Params = Filters & {
    order: string;
    page: string;
    pageSize: string;
    tab: string;
};
