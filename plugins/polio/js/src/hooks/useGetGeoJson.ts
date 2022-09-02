import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetGeoJson = (
    topParentId: number | undefined,
    orgUnitCategory: string,
) => {
    const params = {
        validation_status: 'all',
        asLocation: true,
        limit: 3000,
        order: 'id',
        orgUnitParentId: topParentId,
        orgUnitTypeCategory: orgUnitCategory,
    };

    const queryString = new URLSearchParams(params);

    return useSnackQuery(
        ['geo_json', params],
        () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        undefined,
        {
            enabled: Boolean(topParentId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    );
};
