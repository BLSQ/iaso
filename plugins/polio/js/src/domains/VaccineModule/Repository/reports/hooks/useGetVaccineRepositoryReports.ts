import { UseQueryResult } from 'react-query';
import { useApiParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { ReportParams, VaccineRepositotyForms } from '../../types';

export const tableDefaults = {
    order: 'country_name',
    limit: 10,
    page: 1,
};

// const getVaccineRepositoryReports = (params: ReportParams) => {
//     const queryString = new URLSearchParams(params).toString();
//     return getRequest(`/api/polio/vaccine/repository/reports/?${queryString}`);
// };

const mockVaccineRepositoryReports = () => ({
    count: 1,
    has_next: false,
    has_previous: false,
    page: 1,
    pages: 1,
    limit: 10,
    results: [
        {
            country_name: 'ALGERIA',
            country_id: 29688,
            vaccine: 'mOPV2',
            incident_report_data: [
                {
                    date: '2021-03-16',
                    file: '/media/public_documents/forma/openiaso_pAu8Lar.pdf',
                },
                {
                    date: '2021-03-18',
                    file: undefined,
                },
            ],
            destruction_report_data: [
                {
                    date: undefined,
                    file: undefined,
                },
            ],
        },
        {
            country_name: 'ANGOLA',
            country_id: 29679,
            vaccine: 'mOPV2',
            incident_report_data: [
                {
                    date: '2021-03-18',
                    file: undefined,
                },
            ],
            destruction_report_data: [
                {
                    date: undefined,
                    file: undefined,
                },
                {
                    date: '2021-03-16',
                    file: '/media/public_documents/forma/openiaso_pAu8Lar.pdf',
                },
            ],
        },
    ],
});

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
        //  queryFn: () => getVaccineRepositoryReports(safeParams),
        queryFn: () => Promise.resolve(mockVaccineRepositoryReports()),
        options: {
            staleTime: 60000,
            cacheTime: 60000,
            keepPreviousData: true,
        },
    });
};
