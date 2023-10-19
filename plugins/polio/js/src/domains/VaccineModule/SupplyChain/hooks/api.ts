import { useMemo } from 'react';
import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    deleteRequest,
    getRequest,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useUrlParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { useApiParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useGetCountries } from '../../../../hooks/useGetCountries';

const listUrl = '/api/polio/vaccine/request_forms/';

const getVrfList = params => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${listUrl}?${queryString}`);
};

export const useGetVrfList = params => {
    const safeParams = useUrlParams(params);
    const apiParams = useApiParams(safeParams);
    return useSnackQuery({
        queryKey: [
            'getVrfList',
            apiParams,
            apiParams.page,
            apiParams.limit,
            apiParams.order,
        ],
        queryFn: () => getVrfList(apiParams),
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

const deleteVrf = id => {
    return deleteRequest(`${listUrl}${id}`);
};

export const useDeleteVrf = () => {
    return useSnackMutation({
        mutationFn: deleteVrf,
        invalidateQueryKey: ['getVrfList'],
    });
};

export const useGetCountriesOptions = () => {
    const { data: countries, isFetching } = useGetCountries();
    return useMemo(() => {
        const options = countries
            ? countries.orgUnits.map(country => {
                  return {
                      label: country.name,
                      value: country.id,
                  };
              })
            : [];
        return { data: options, isFetching };
    }, [countries, isFetching]);
};
