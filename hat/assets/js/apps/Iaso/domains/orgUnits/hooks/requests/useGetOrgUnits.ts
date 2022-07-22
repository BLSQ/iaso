import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { OrgUnit } from '../../types/orgUnit';
import { Search } from '../../types/search';

import { ApiParams } from '../useGetApiParams';

import { Pagination } from '../../../../types/table';

type Count = {
    index: number;
    count: number;
};
type Result = Pagination & {
    orgunits: OrgUnit[];
    counts: Count[];
};

export const useGetOrgUnits = (
    apiParams: ApiParams,
    triggerSearch: boolean,
    searches: Search[],
    callback: () => void = () => null,
): UseQueryResult<Result, Error> => {
    const onSuccess = () => callback();
    const queryKey: any[] = ['orgunits'];
    const queryString = new URLSearchParams(apiParams);
    return useSnackQuery(
        queryKey,
        () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        undefined,
        {
            enabled: triggerSearch,
            onSuccess,
            select: data => {
                console.log('data', data);
                console.log('searches', searches);
                return data;
            },
        },
    );
};
