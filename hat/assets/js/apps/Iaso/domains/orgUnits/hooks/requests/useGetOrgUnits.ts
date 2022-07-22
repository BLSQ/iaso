import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { OrgUnit } from '../../types/orgUnit';

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

type Props = {
    params: ApiParams;
    enabled: boolean;
    callback?: () => void;
    queryKey?: Array<string>;
    // eslint-disable-next-line no-unused-vars
    select?: (data: Result) => any;
};

export const useGetOrgUnits = ({
    params,
    enabled,
    callback = () => null,
    queryKey = ['orgunits'],
    select = data => data,
}: Props): UseQueryResult<Result, Error> => {
    const onSuccess = () => callback();
    const queryString = new URLSearchParams(params);
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        options: {
            enabled,
            onSuccess,
            select,
        },
    });
};
