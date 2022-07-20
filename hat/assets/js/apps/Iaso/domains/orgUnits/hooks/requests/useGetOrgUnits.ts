/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { OrgUnitsApi, OrgUnit, OrgUnitParams } from '../../types/orgUnit';
import { Search } from '../../types/search';

import { useGetApiParams } from '../useGetApiParams';

import { Pagination } from '../../../../types/table';

type Result = Pagination & {
    orgunits: OrgUnit[];
}


const getDataSources = (): Promise<OrgUnitsApi> => {
    return getRequest('/api/orgunits/');
};

export const useGetOrgUnits = (searches: [Search], params: OrgUnitParams, searchActive): UseQueryResult<Result, Error> => {
    const {apiParams} = useGetApiParams(searches, params)
    const queryKey: any[] = ['orgunits', apiParams];
    const queryString = new URLSearchParams(apiParams);
    return useSnackQuery(queryKey, () => getRequest(`/api/orgunits/?${queryString.toString()}`), undefined, {
        enabled: searchActive === 'true',
    });
};
