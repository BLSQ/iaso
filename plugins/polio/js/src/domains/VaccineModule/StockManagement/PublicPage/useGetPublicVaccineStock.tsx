import { useAppId } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/app/hooks/useAppId';
import { useApiParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useUrlParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { PublicVaccineStockResponse } from './types';

const usableEndpoint = '/api/polio/dashboards/public/vaccine_stock/get_usable';
const unusableEndpoint =
    '/api/polio/dashboards/public/vaccine_stock/get_unusable';

const defaults = {
    order: '-date',
    pageSize: 50,
    page: 1,
};

const getPublicVaccineStock = (
    queryString = '',
    usable = true,
): Promise<PublicVaccineStockResponse> => {
    const endpoint = usable ? usableEndpoint : unusableEndpoint;
    return getRequest(`${endpoint}/?${queryString}`);
};
export const useGetPublicVaccineStock = (allParams: Record<string, string>) => {
    const appId = useAppId();
    const { tab, ...params } = allParams;
    const isUsable = (tab ?? 'usable') === 'usable';
    const safeParams = useUrlParams(
        { ...params, app_id: appId } as Parameters<typeof useUrlParams>[0],
        defaults,
    );
    const apiParams = useApiParams(safeParams);
    const queryString = new URLSearchParams(apiParams).toString();

    return useSnackQuery<PublicVaccineStockResponse>({
        queryKey: ['public_stock', queryString, tab],
        queryFn: () => getPublicVaccineStock(queryString, isUsable),
        options: {
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
        },
    });
};
