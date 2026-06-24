import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { useAppId } from '../../../../../../../../../hat/assets/js/apps/Iaso/domains/app/hooks/useAppId';

export const useGetRegions = (
    country?: number,
    isEmbedded = false,
): UseQueryResult<{ name: string; id: number }[]> => {
    const appId = useAppId();
    const params: Record<string, string> = {
        validation_status: 'all',
        limit: '3000',
        order: 'id',
        orgUnitParentId: `${country}`,
        orgUnitTypeCategory: 'REGION',
    };
    if (isEmbedded) {
        params.app_id = appId;
    }

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
