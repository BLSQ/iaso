import { useMutation, useQueryClient } from 'react-query';
import { sendRequest } from '../utils/networking';

export const useSaveCampaign = () => {
    const queryClient = useQueryClient();

    const mutationFn = body => {
        if (body.id) {
            return sendRequest('PUT', `/api/polio/campaigns/${body.id}`, body);
        }
        return sendRequest('POST', '/api/polio/campaigns/', body);
    };

    const { mutate, ...result } = useMutation(mutationFn);

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
