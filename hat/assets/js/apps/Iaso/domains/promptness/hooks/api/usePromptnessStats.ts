import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { Form } from '../../../forms/types/forms';
import { DEFAULT_PAGE_SIZE } from '../../constants';
import {
    PromptnessRouterParams,
    PromptnessStatsApiResponse,
    PromptnessSummary,
} from '../../types';
import { getDefaultOrder } from '../../utils';

const API_URL = '/api/promptness_stats/';

type PromptnessApiParams = Record<string, string | undefined>;

const getFilterApiParams = (
    params: PromptnessRouterParams,
): PromptnessApiParams => ({
    form_id: params.formId,
    period: params.period,
    parent_org_unit_id: params.orgUnitId ?? params.parentId,
    org_unit_type_ids: params.orgUnitTypeIds || undefined,
    status: params.status || undefined,
});

const getOrder = (params: PromptnessRouterParams): string =>
    params.order ?? getDefaultOrder(params.status);

const getListApiParams = (
    params: PromptnessRouterParams,
): PromptnessApiParams => ({
    ...getFilterApiParams(params),
    order: getOrder(params),
    page: params.page ?? '1',
    limit: params.pageSize ?? `${DEFAULT_PAGE_SIZE}`,
});

export const canComputePromptness = (
    params: PromptnessRouterParams,
    form?: Partial<Pick<Form, 'period_type' | 'promptness_grace_period_days'>>,
): boolean =>
    Boolean(
        params.formId &&
        params.period &&
        params.parentId &&
        form?.period_type &&
        typeof form.promptness_grace_period_days === 'number',
    );

export const getPromptnessCsvUrl = (params: PromptnessRouterParams): string =>
    makeUrlWithParams(`${API_URL}export_csv/`, {
        ...getFilterApiParams(params),
        order: getOrder(params),
    });

export const useGetPromptnessStats = (
    params: PromptnessRouterParams,
    enabled: boolean,
): UseQueryResult<PromptnessStatsApiResponse, Error> => {
    const apiParams = getListApiParams(params);
    return useSnackQuery({
        queryKey: ['promptnessStats', apiParams],
        queryFn: () => getRequest(makeUrlWithParams(API_URL, apiParams)),
        options: {
            enabled,
            retry: 0,
            keepPreviousData: true,
        },
    });
};

export const useGetPromptnessSummary = (
    params: PromptnessRouterParams,
    enabled: boolean,
): UseQueryResult<PromptnessSummary, Error> => {
    const apiParams = getFilterApiParams(params);
    return useSnackQuery({
        queryKey: ['promptnessStats', 'summary', apiParams],
        queryFn: () =>
            getRequest(makeUrlWithParams(`${API_URL}summary/`, apiParams)),
        options: {
            enabled,
            retry: 0,
            keepPreviousData: true,
        },
    });
};
