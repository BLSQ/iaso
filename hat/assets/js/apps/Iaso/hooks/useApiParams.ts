import { useMemo } from 'react';
import { ApiParams, UrlParams } from 'bluesquare-components';
import { cleanupParams } from '../utils/requests';

export type FormattedApiParams = ApiParams & Record<string, any>;

export const useApiParams = (
    params: Partial<UrlParams> & Record<string, any>,
    defaults?: { order?: string; limit?: number; page?: number },
): FormattedApiParams => {
    return useMemo(() => {
        const formattedParams: Record<string, any> = cleanupParams(params);
        if (!params.order && defaults?.order) {
            formattedParams.order = defaults.order;
        }
        if (params.tab) {
            delete formattedParams.tab;
        }
        if (params.pageSize) {
            formattedParams.limit = params.pageSize;
            delete formattedParams.pageSize;
        } else if (defaults?.limit) {
            formattedParams.limit = defaults.limit;
        }

        if (!params.page && defaults?.page) {
            formattedParams.page = defaults.page;
        } else if (!params.page) {
            formattedParams.page = 1;
        }
        if (formattedParams.accountId) {
            delete formattedParams.accountId;
        }
        return formattedParams as FormattedApiParams;
    }, [defaults?.limit, defaults?.order, defaults?.page, params]);
};

export type TableDefaults = {
    order: string;
    limit: number;
    page: number;
};
export const useQueryString = (
    params: Record<string, string>,
    tableDefaults: TableDefaults,
): string => {
    const apiParams = useApiParams(params, tableDefaults);
    return new URLSearchParams(apiParams).toString();
};
