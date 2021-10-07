import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

export const useGetCountries = () => {
    const params = {
        validation_status: 'all',
        order: 'name',
        orgUnitTypeCategory: 'country',
    };

    const queryString = new URLSearchParams(params);

    return useSnackQuery(
        ['countries', params],
        () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        undefined,
        {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    );
};
