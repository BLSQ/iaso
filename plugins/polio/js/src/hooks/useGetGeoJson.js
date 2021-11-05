import { getRequest } from 'iaso/libs/Api';
import { useSnackQuery } from 'iaso/libs/apiHooks';

export const useGetGeoJson = (country, orgUnitCategory) => {
    const params = {
        validation_status: 'all',
        asLocation: true,
        limit: 3000,
        order: 'id',
        orgUnitParentId: country,
        orgUnitTypeCategory: orgUnitCategory,
    };

    const queryString = new URLSearchParams(params);

    return useSnackQuery(
        ['geo_json', params],
        () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        undefined,
        {
            enabled: Boolean(country),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    );
};
