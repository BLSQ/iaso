import { UseQueryResult } from 'react-query';
import { useApiParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { ReportParams, VaccineRepositotyForms } from '../../types';

export const tableDefaults = {
    order: 'country_name',
    limit: 10,
    page: 1,
};

const getVaccineRepositoryReports = params => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`/api/polio/vaccine/repository_reports/?${queryString}`);
};

type Response = {
    limit: number;
    count: number;
    results: VaccineRepositotyForms[];
    has_previous: boolean;
    has_next: boolean;
    page: number;
    pages: number;
};

export const useGetVaccineRepositoryReports = (
    params: ReportParams,
    defaults = tableDefaults,
): UseQueryResult<Response, Error> => {
    const safeParams: Record<string, string> = useApiParams(
        {
            countries: params.reportCountries,
            country_block: params.reportCountryBlock,
            file_type: params.reportFileType,
            vaccine_name: params.reportVaccineName,
            page_size: params.reportPageSize || tableDefaults.limit,
            order: params.reportOrder || tableDefaults.order,
            page: params.reportPage || `${tableDefaults.page}`,
        },
        defaults,
    );

    return useSnackQuery({
        queryKey: ['vaccineRepositoryReports', safeParams],
        queryFn: () => getVaccineRepositoryReports(safeParams),
        options: {
            staleTime: 60000,
            cacheTime: 60000,
            keepPreviousData: true,
        },
    });
};
