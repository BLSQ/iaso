import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { Instance } from '../../types/instance';
import { useSnackQuery } from '../../../../libs/apiHooks';
import MESSAGES from '../../../../components/snackBars/messages';

export const useGetInstance = (
    instanceId: string | undefined,
): UseQueryResult<Instance, Error> => {
    return useSnackQuery<Instance, Error>(
        ['instance', instanceId],
        () => getRequest(`/api/instances/${instanceId}/`),
        MESSAGES.fetchInstanceError,
        {
            enabled: Boolean(instanceId),
            retry: false,
            staleTime: 1000 * 60 * 15,
            cacheTime: 1000 * 60 * 5,
        },
    );
};
