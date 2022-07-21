import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { OrgUnit } from '../../types/orgUnit';

import { ApiParams } from '../useGetApiParams';

import { Pagination } from '../../../../types/table';

type Result = Pagination & {
    orgunits: OrgUnit[];
};

export const useGetOrgUnits = (
    apiParams: ApiParams,
    triggerSearch: boolean,
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
        },
    );
};
