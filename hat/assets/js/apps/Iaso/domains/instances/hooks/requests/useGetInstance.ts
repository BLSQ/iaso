import { useQueries, UseQueryOptions, UseQueryResult } from 'react-query';
import MESSAGES from '../../../../components/snackBars/messages';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { Instance } from '../../types/instance';

const defaultParams: UseQueryOptions<Instance, Error> = {};

const instanceQueryKey = (
    instanceId: number | string | undefined,
    params: UseQueryOptions<Instance, Error>,
) => ['instance', instanceId, params];

const fetchInstance = (
    instanceId: number | string | undefined,
): Promise<Instance> => getRequest(`/api/instances/${instanceId}/`);

const baseOptions = {
    retry: false,
    staleTime: 1000 * 60 * 15,
    cacheTime: 1000 * 60 * 5,
};

export const useGetInstance = (
    instanceId: number | string | undefined,
    params = defaultParams,
): UseQueryResult<Instance, Error> => {
    return useSnackQuery<Instance, Error>({
        queryKey: instanceQueryKey(instanceId, params),
        queryFn: () => fetchInstance(instanceId),
        snackErrorMsg: MESSAGES.fetchInstanceError,
        options: {
            enabled: Boolean(instanceId),
            ...baseOptions,
            ...params,
        },
    });
};

export const useGetInstances = (
    instanceIds: Array<number | string>,
): UseQueryResult<Instance, Error>[] =>
    useQueries(
        instanceIds.map(instanceId => ({
            queryKey: instanceQueryKey(instanceId, defaultParams),
            queryFn: () => fetchInstance(instanceId),
            enabled: Boolean(instanceId),
            ...baseOptions,
        })),
    ) as UseQueryResult<Instance, Error>[];
