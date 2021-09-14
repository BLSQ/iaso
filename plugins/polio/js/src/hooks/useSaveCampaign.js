import { useQueryClient } from 'react-query';
import { sendRequest, useSnackMutation } from '../utils/networking';

export const useSaveCampaign = () => {
    const queryClient = useQueryClient();

    const { mutate, ...result } = useSnackMutation(body => {
        const method = body.id ? 'PUT' : 'POST';
        const path = `/api/polio/campaigns/${body.id ? `${body.id}/` : ''}`;
        return sendRequest(method, path, body);
    });

    return {
        ...result,
        mutate: (variables, { onSuccess, ...options }) =>
            mutate(variables, {
                ...options,
                onSuccess: async (...args) => {
                    await queryClient.invalidateQueries(['polio', 'campaigns']);
                    onSuccess(...args);
                },
            }),
    };
};
