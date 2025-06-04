import { UseQueryResult } from 'react-query';
import { useApiParams } from '../../../../hooks/useApiParams';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

const apiUrl = '/api/algorithmsruns';
export const tableDefaults = {
    page: 1,
    limit: 10,
    order: '-ended_at',
};

const getAlgos = async queryString => {
    return getRequest(`${apiUrl}/?${queryString}`);
};

type Args = {
    params: Record<string, string>;
    enabled: boolean;
};
export const useGetAlgorithmRuns = ({
    params,
    enabled = false,
}: Args): UseQueryResult<any> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { accountId, ...tableParams } = params;
    const apiParams = useApiParams(tableParams, tableDefaults);
    const queryString = new URLSearchParams(apiParams).toString();
    return useSnackQuery({
        queryKey: ['algos', queryString],
        queryFn: () => getAlgos(queryString),
        options: {
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
            enabled,
        },
    });
};
