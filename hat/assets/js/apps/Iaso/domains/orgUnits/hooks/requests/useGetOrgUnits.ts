/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { OrgUnitsApi, OrgUnit } from '../../types/orgUnit';

const getDataSources = (): Promise<OrgUnitsApi> => {
    return getRequest('/api/orgunits/');
};

export const useGetOrgUnits = (): UseQueryResult<OrgUnit[], Error> => {
    const queryKey: any[] = ['orgunits'];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getDataSources(), undefined, {
        select: data => {
            if (!data) return [];
            return data.orgunits;
        },
    });
};
