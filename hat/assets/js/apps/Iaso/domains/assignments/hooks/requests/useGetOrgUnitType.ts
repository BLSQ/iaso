import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { getRequest } from '../../../../libs/Api';

import { OrgunitType } from '../../types/orgunitTypes';

const getOrgunitType = (
    orgUnitTypeId: number | undefined | null,
): Promise<OrgunitType> => {
    return getRequest(`/api/orgunittypes/${orgUnitTypeId}`);
};
export const useGetOrgUnitType = (
    orgUnitTypeId: number | undefined | null,
): UseQueryResult<OrgunitType, Error> => {
    const queryKey: any[] = ['orgunittype', orgUnitTypeId];
    // @ts-ignore
    return useSnackQuery(
        queryKey,
        () => getOrgunitType(orgUnitTypeId),
        undefined,
        {
            retry: false,
            enabled: Boolean(orgUnitTypeId),
        },
    );
};
