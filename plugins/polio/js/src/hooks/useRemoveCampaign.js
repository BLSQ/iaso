import { useMutation, useQueryClient } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useRemoveCampaign = () => {
    const queryClient = useQueryClient();

    const { mutate, ...result } = useMutation(id =>
        sendRequest('DELETE', `/api/polio/campaigns/${id}`),
    );

    return {
        ...result,
        mutate: (variables, { onSuccess, ...options }) =>
            mutate(variables, {
                ...options,
                onSuccess: (...args) => {
                    queryClient.invalidateQueries(['polio', 'campaigns']);
                    onSuccess(...args);
                },
            }),
    };
};
