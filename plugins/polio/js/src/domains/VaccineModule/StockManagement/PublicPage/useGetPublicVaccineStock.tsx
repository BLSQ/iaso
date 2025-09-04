import { useApiParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useUrlParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const usableEndpoint = '/api/polio/dashboards/public/vaccine_stock/get_usable';
const unusableEndpoint =
    '/api/polio/dashboards/public/vaccine_stock/get_unusable';

const defaults = {
    order: '-date',
    pageSize: 50,
    page: 1,
};

const getPublicVaccineStock = (queryString = '', usable = true) => {
    const endpoint = usable ? usableEndpoint : unusableEndpoint;
    return getRequest(`${endpoint}/?${queryString}`);
};
export const useGetPublicVaccineStock = allParams => {
    const { tab, ...params } = allParams;
    const isUsable = (tab ?? 'usable') === 'usable';
    const safeParams = useUrlParams(
        { ...params, app_id: 'campaigns.tracking' },
        defaults,
    );
    const apiParams = useApiParams(safeParams);
    const queryString = new URLSearchParams(apiParams).toString();

    return useSnackQuery({
        queryKey: ['public_stock', queryString, tab],
        queryFn: () => getPublicVaccineStock(queryString, isUsable),
        options: {
            select: data => {
                return data ?? {};
            },
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
        },
    });
};
