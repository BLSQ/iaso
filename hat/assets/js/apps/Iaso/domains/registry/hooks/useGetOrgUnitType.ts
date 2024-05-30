import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

import { OrgunitType } from '../../orgUnits/types/orgunitTypes';

export const useGetOrgUnitType = (
    orgUnitTypeId: number | undefined,
): UseQueryResult<OrgunitType, Error> => {
    const queryKey: any[] = ['orgUnitType', orgUnitTypeId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(`/api/v2/orgunittypes/${orgUnitTypeId}/`),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            retry: false,
            enabled: Boolean(orgUnitTypeId),
        },
    });
};
