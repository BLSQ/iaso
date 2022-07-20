/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { OrgUnitsApi, OrgUnit, OrgUnitParams } from '../../types/orgUnit';
import { Search } from '../../types/search';

import { useGetApiParams } from '../useGetApiParams';

const getDataSources = (): Promise<OrgUnitsApi> => {
    return getRequest('/api/orgunits/');
};

export const useGetOrgUnits = (searches: [Search], params: OrgUnitParams, searchActive): UseQueryResult<OrgUnit[], Error> => {
    const apiParams = useGetApiParams(searches, params)
    const queryKey: any[] = ['orgunits', apiParams];
    const queryString = new URLSearchParams(apiParams);
    return useSnackQuery(queryKey, () => getRequest(`/api/orgunits/?${queryString.toString()}`), undefined, {
        enabled: searchActive === 'true',
        select: data => {
            if (!data) return [];
            return data.orgunits;
        },
    });
};
