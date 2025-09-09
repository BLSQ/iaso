import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetRegions = (
    country?: number,
): UseQueryResult<{ name: string; id: number }[]> => {
    const params = {
        validation_status: 'all',
        limit: '3000',
        order: 'id',
        orgUnitParentId: `${country}`,
        orgUnitTypeCategory: 'REGION',
    };

    const queryString = new URLSearchParams(params).toString();

    return useSnackQuery(
        ['regions', params],
        () => getRequest(`/api/orgunits/?${queryString}`),
        undefined,
        {
            enabled: Boolean(country),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data =>
                data?.orgunits
                    .filter(orgUnit => orgUnit.parent_id === country)
                    .map(orgUnit => ({
                        name: orgUnit.name,
                        id: orgUnit.id,
                    })) ?? [],
        },
    );
};
