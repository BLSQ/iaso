import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

import { OrgunitType } from '../../orgUnits/types/orgunitTypes';

export const useGetOrgUnitType = (
    orgUnitTypeId: number | undefined,
): UseQueryResult<OrgunitType, Error> => {
    const queryKey: any[] = ['orgUnitType', orgUnitTypeId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(`/api/v2/orgunittypes/${orgUnitTypeId}/`),
        options: {
            retry: false,
            enabled: Boolean(orgUnitTypeId),
        },
    });
};
