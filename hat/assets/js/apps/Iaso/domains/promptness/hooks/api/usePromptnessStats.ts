import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { DEFAULT_ORDER, DEFAULT_PAGE_SIZE } from '../../constants';
import {
    PromptnessRouterParams,
    PromptnessStatsApiResponse,
    PromptnessSummary,
} from '../../types';

const API_URL = '/api/promptness_stats/';

type PromptnessApiParams = Record<string, string | undefined>;

// The 3 endpoints of the API share the same filters, see docs/pages/dev/reference/API/promptness_stats.en.md
const getFilterApiParams = (
    params: PromptnessRouterParams,
): PromptnessApiParams => ({
    form_id: params.formId,
    period: params.period,
    parent_org_unit_id: params.orgUnitId ?? params.parentId,
    org_unit_type_ids: params.orgUnitTypeIds || undefined,
    status: params.status || undefined,
});

const getListApiParams = (
    params: PromptnessRouterParams,
): PromptnessApiParams => ({
    ...getFilterApiParams(params),
    order: params.order ?? DEFAULT_ORDER,
    page: params.page ?? '1',
    limit: params.pageSize ?? `${DEFAULT_PAGE_SIZE}`,
});

// The API answers with a 400 if one of these filters is missing
export const hasRequiredFilters = (params: PromptnessRouterParams): boolean =>
    Boolean(params.formId && params.period && params.parentId);

export const getPromptnessCsvUrl = (params: PromptnessRouterParams): string =>
    makeUrlWithParams(`${API_URL}export_csv/`, {
        ...getFilterApiParams(params),
        order: params.order ?? DEFAULT_ORDER,
    });

export const useGetPromptnessStats = (
    params: PromptnessRouterParams,
): UseQueryResult<PromptnessStatsApiResponse, Error> => {
    const apiParams = getListApiParams(params);
    return useSnackQuery({
        queryKey: ['promptnessStats', apiParams],
        queryFn: () => getRequest(makeUrlWithParams(API_URL, apiParams)),
        options: {
            enabled: hasRequiredFilters(params),
            retry: 0,
            // Avoid blanking the table while changing page, order or parent
            keepPreviousData: true,
        },
    });
};

export const useGetPromptnessSummary = (
    params: PromptnessRouterParams,
): UseQueryResult<PromptnessSummary, Error> => {
    // Doesn't depend on the ordering nor the page of the table
    const apiParams = getFilterApiParams(params);
    return useSnackQuery({
        queryKey: ['promptnessStats', 'summary', apiParams],
        queryFn: () =>
            getRequest(makeUrlWithParams(`${API_URL}summary/`, apiParams)),
        options: {
            enabled: hasRequiredFilters(params),
            retry: 0,
            keepPreviousData: true,
        },
    });
};
