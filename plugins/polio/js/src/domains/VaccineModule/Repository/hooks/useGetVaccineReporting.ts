import { UseQueryResult } from 'react-query';
import { useApiParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const getVaccineReporting = params => {
    const apiParams = {
        ...params,
        campaign_status: params.campaignStatus,
    };
    const queryString = new URLSearchParams(apiParams).toString();
    return getRequest(`/api/polio/vaccine/repository/?${queryString}`);
};
export const tableDefaults = {
    order: 'updated_at',
    limit: 10,
    page: 1,
};

export type DocumentData = {
    date?: string;
    file?: string;
};

type VaccineReporting = {
    country_name: string;
    campaign_obr_name: string;
    rounds_count: string;
    start_date: string;
    vrf_data: DocumentData[];
    pre_alert_data: DocumentData[];
    form_a_data: DocumentData[];
    incident_reports: DocumentData[];
    destruction_reports: DocumentData[];
};

type Response = {
    limit: number;
    count: number;
    results: VaccineReporting[];
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
