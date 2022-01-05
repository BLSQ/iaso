import { UseQueryResult, useQuery } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { Instance } from '../../types/instance';

export const useGetInstance = (
    instanceId: string | undefined,
): UseQueryResult<Instance, Error> => {
    return useQuery<Instance, Error>(
        ['instance', instanceId],
        () => getRequest(`/api/instances/${instanceId}`),
        {
            enabled: Boolean(instanceId),
            retry: false,
        },
    );
};
