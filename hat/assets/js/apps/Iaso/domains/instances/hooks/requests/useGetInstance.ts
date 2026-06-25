import { UseQueryOptions, UseQueryResult } from 'react-query';
import MESSAGES from '../../../../components/snackBars/messages';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { Instance } from '../../types/instance';

const defaultParams: UseQueryOptions<Instance, Error> = {};

export const useGetInstance = (
    instanceId: number | string | undefined,
    params = defaultParams,
): UseQueryResult<Instance, Error> => {
    return useSnackQuery<Instance, Error>({
        queryKey: ['instance', instanceId, params],
        queryFn: () => getRequest(`/api/instances/${instanceId}/`),
        snackErrorMsg: MESSAGES.fetchInstanceError,
        options: {
            enabled: Boolean(instanceId),
            retry: false,
            staleTime: 1000 * 60 * 15,
            cacheTime: 1000 * 60 * 5,
            ...params,
        },
    });
};
