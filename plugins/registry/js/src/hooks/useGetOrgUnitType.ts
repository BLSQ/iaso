import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { OrgunitType } from '../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgunitTypes';

export const useGetOrgUnitType = (
    orgUnitTypeId: number | undefined,
    appId?: string,
): UseQueryResult<OrgunitType, Error> => {
    const queryKey: any[] = ['orgUnitType', orgUnitTypeId];
    return useSnackQuery({
        queryKey,
        queryFn: () =>
            getRequest(
                `/api/v2/orgunittypes/${orgUnitTypeId}/?app_id=${appId}`,
            ),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            retry: false,
            enabled: Boolean(orgUnitTypeId && appId),
        },
    });
};
