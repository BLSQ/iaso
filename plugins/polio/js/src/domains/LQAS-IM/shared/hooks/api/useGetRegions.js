import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetRegions = country => {
    const params = {
        validation_status: 'all',
        limit: 3000,
        order: 'id',
        orgUnitParentId: country,
        // FIXME this is not super safe as the ids can change from one account to the other
        // orgUnitTypeId: 6,
        orgUnitTypeCategory: 'REGION',
    };

    const queryString = new URLSearchParams(params);

    return useSnackQuery(
        ['regions', params],
        () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        undefined,
        {
            enabled: Boolean(country),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data =>
                data.orgunits
                    .filter(orgUnit => orgUnit.parent_id === country)
                    .map(orgUnit => ({
                        name: orgUnit.name,
                        id: orgUnit.id,
                    })),
        },
    );
};
