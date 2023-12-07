import { UseQueryResult } from 'react-query';
import { useUrlParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import {
    FormattedApiParams,
    useApiParams,
} from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { waitFor } from '../../../../../../../../hat/assets/js/apps/Iaso/utils';
import { mockVaccineStockList } from '../mocks/mockVaccineStockList';
import { StockManagementListParams } from '../types';

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const getVaccineStockList = async (params: FormattedApiParams) => {
    waitFor(750);
    return mockVaccineStockList;
};

const defaults = {
    order: 'country',
    pageSize: 20,
    page: 1,
};

export const useGetVaccineStockList = (
    params: StockManagementListParams,
): UseQueryResult<any, any> => {
    const safeParams = useUrlParams(params, defaults);
    const apiParams = useApiParams(safeParams);
    return useSnackQuery({
        queryKey: [
            'vaccine-stock-list',
            apiParams,
            apiParams.page,
            apiParams.limit,
            apiParams.order,
        ],
        queryFn: () => getVaccineStockList(apiParams),
        options: {
            select: data => {
                if (!data) return { results: [] };
                return data;
            },
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};
