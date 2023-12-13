/* eslint-disable camelcase */
export type StockManagementListParams = {
    order?: string;
    pageSize?: string; // number as string
    page?: string; // number as string
    accountId: string; // number as string
    search?: string;
    country_id?: string; // number as string
    vaccine_type?: string;
};
