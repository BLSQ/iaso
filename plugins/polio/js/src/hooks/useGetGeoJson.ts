import { UseQueryResult } from 'react-query';

// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { OrgUnit } from '../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';

export const useGetGeoJson = (
    topParentId: number | undefined,
    orgUnitCategory: string,
): UseQueryResult<OrgUnit[], Error> => {
    const params = {
        validation_status: 'all',
        withShapes: 'true',
        order: 'id',
        orgUnitParentId: `${topParentId}`,
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
            select: data => data?.orgUnits,
        },
    );
};
