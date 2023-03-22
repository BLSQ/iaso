import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { makeUrlWithParams } from '../../../libs/utils';

export const useGetOrgUnit = (
    orgUnitId: string,
): UseQueryResult<OrgUnit, Error> => {
    const queryKey: any[] = ['orgUnit', orgUnitId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(`/api/orgunits/${orgUnitId}/`),
        options: {
            retry: false,
        },
    });
};

type Result = {
    orgUnits: OrgUnit[];
};

export const useGetOrgUnitsChildren = (
    orgUnitParentId: string,
): UseQueryResult<OrgUnit[], Error> => {
    const params: Record<string, any> = {
        validation_status: 'all',
        withShapes: true,
        orgUnitParentId,
        onlyDirectChildren: true,
    };

    const url = makeUrlWithParams('/api/orgunits/', params);
    return useSnackQuery({
        queryKey: ['orgUnits', params],
        queryFn: () => getRequest(url),
        options: {
            select: (data: Result): OrgUnit[] => data?.orgUnits,
        },
    });
};
