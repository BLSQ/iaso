import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

import { OrgUnit } from '../../orgUnits/types/orgUnit';

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
