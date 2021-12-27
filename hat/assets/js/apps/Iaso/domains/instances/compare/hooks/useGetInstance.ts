import { UseQueryResult, useQuery } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { IInstance } from '../../types/instance';

export const useGetInstance = (
    instanceId: string | undefined,
): UseQueryResult<IInstance, Error> => {
    return useQuery<IInstance, Error>(
        ['instance', { id: instanceId }],
        () => getRequest(`/api/instances/${instanceId}`),
        {
            enabled: Boolean(instanceId),
            retry: false,
        },
    );
};
