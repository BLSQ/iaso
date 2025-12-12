import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks.ts';
import { appId } from '../constants/app.ts';

export const useGetCountries = (status = 'all', enabled = true) => {
    const params = {
        validation_status: status,
        order: 'name',
        orgUnitTypeCategory: 'country',
        app_id: appId,
    };

    const queryString = new URLSearchParams(params);

    return useSnackQuery({
        queryKey: ['orgunits', 'countries', params],
        queryFn: () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        options: {
            staleTime: Infinity,
            cacheTime: Infinity,
            enabled,
        },
    });
};
