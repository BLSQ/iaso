import { UseQueryResult } from 'react-query';
import { useApiParams } from 'Iaso/hooks/useApiParams';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

const getSkus = params => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`/api/stockkeepingunits/?${queryString}`).then(value => {
        return value.results.map(f => {
            return {
                value: f.id,
                label: f.name,
            };
        });
    });
};

export const tableDefaults = {
    order: 'name',
    limit: 50,
    page: 1,
};

type ValueLabel = {
    value: string;
    label: string;
};
export const useGetSkusDropdownOptions = (
    params,
    defaults = tableDefaults,
): UseQueryResult<ValueLabel[], Error> => {
    const safeParams = useApiParams(params, defaults);
    if (safeParams?.accountId) {
        delete safeParams.accountId;
    }
    return useSnackQuery({
        queryKey: ['stock_keeping_units', 'options', safeParams],
        queryFn: () => getSkus({ ...safeParams }),
        options: {
            staleTime: 60000,
            cacheTime: 60000,
            keepPreviousData: true,
        },
    });
};
