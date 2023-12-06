import { ApiParams, UrlParams } from 'bluesquare-components';
import { useMemo } from 'react';
import { cleanupParams } from '../utils/requests';

export type FormattedApiParams = ApiParams & Record<string, any>;

export const useApiParams = (
    params: Partial<UrlParams>,
    defaults?: { order?: string; limit?: number; page?: number },
): FormattedApiParams => {
    return useMemo(() => {
        const formattedParams: Record<string, any> = cleanupParams(params);
        if (!params.order && defaults?.order) {
            formattedParams.order = defaults.order;
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
