/* eslint-disable camelcase */
import { useMemo } from 'react';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getApiParamDateString } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/dates';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

const getBudgets = (params: any) => {
    const filteredParams = Object.entries(params).filter(
        // eslint-disable-next-line no-unused-vars
        ([_key, value]) => value !== undefined,
    );
    filteredParams.push(['order', '-cvdpv2_notified_at']);
    const queryString = new URLSearchParams(
        Object.fromEntries(filteredParams) as Record<string, any>,
    ).toString();
    return getRequest(`/api/polio/budget/?${queryString}`);
};

export const useGetBudgets = (options: any): any => {
    const params = {
        limit: options.pageSize,
        page: options.page,
        order: options.order,
        search: options.search,
        current_state__key: options.current_state__key,
    };

    return useSnackQuery({
        queryFn: () => getBudgets(params),
        queryKey: ['budget', 'all', params],
    });
};

export const useBudgetParams = params => {
    return useMemo(() => {
        return {
            order: params?.order ?? '-obr_name',
            pageSize: params?.pageSize ?? 20,
            page: params?.page ?? 1,
            search: params.search,
            roundStartFrom: getApiParamDateString(params.roundStartFrom),
            roundStartTo: getApiParamDateString(params.roundStartTo),
        };
    }, [
        params?.order,
        params?.page,
        params?.pageSize,
        params.roundStartFrom,
        params.roundStartTo,
        params.search,
    ]);
};

const getBudgetForCampaign = (id?: string) => {
    return getRequest(`/api/polio/budget/${id}/`);
};

export const useGetBudgetForCampaign = (id?: string) => {
    return useSnackQuery({
        queryFn: () => getBudgetForCampaign(id),
        queryKey: ['budget', 'campaign', id],
        options: { enabled: Boolean(id) },
    });
};
