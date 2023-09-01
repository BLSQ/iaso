import { UrlParams } from 'bluesquare-components';
import { useMemo } from 'react';
import { cleanupParams } from '../utils/requests';

export type FormattedUrlParams = UrlParams & Record<string, any>;

export const useUrlParams = (
    params: Partial<UrlParams>,
    defaults: { order?: string; pageSize?: number; page?: number } = {
        order: '-updated_at',
        pageSize: 20,
        page: 1,
    },
): FormattedUrlParams => {
    return useMemo(() => {
        const formattedParams: Record<string, any> = cleanupParams(params);
        if (!params.order && defaults?.order) {
            formattedParams.order = defaults.order;
        }
        if (!params.pageSize && defaults?.pageSize) {
            formattedParams.pageSize = defaults.pageSize;
        }
        if (!params.page && defaults?.page) {
            formattedParams.page = defaults.page;
        } else if (!params.page) {
            formattedParams.page = 1;
        }
        return formattedParams as FormattedUrlParams;
    }, [defaults?.order, defaults?.page, defaults?.pageSize, params]);
};
