import { UseQueryResult } from 'react-query';
import { useApiParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { VaccineRepositoryForms } from '../../types';

const getVaccineReporting = params => {
    const apiParams = params.campaignStatus
        ? {
              ...params,
              campaign_status: params.campaignStatus,
          }
        : params;
    const queryString = new URLSearchParams(apiParams).toString();
    return getRequest(`/api/polio/vaccine/repository/?${queryString}`);
};
export const tableDefaults = {
    order: '-campaign_started_at',
    limit: 50,
    page: 1,
};

type Response = {
    limit: number;
    count: number;
    results: VaccineRepositoryForms[];
    has_previous: boolean;
    has_next: boolean;
    page: number;
    pages: number;
};
export const useGetVaccineReporting = (
    params = {},
    defaults = tableDefaults,
): UseQueryResult<Response, Error> => {
    const safeParams = useApiParams(params, defaults);
    if (safeParams?.accountId) {
        delete safeParams.accountId;
    }
    return useSnackQuery({
        queryKey: ['vaccineReporting', safeParams],
        queryFn: () => getVaccineReporting({ ...safeParams }),
        options: {
            staleTime: 60000,
            cacheTime: 60000,
            keepPreviousData: true,
        },
    });
};
