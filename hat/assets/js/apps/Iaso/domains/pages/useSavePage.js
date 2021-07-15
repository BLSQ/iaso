import { useMutation, useQueryClient } from 'react-query';
import { sendRequest } from './networking';

export const useSavePage = () => {
    const queryClient = useQueryClient();

    const { mutate, ...result } = useMutation(body => {
        const method = body.id ? 'PUT' : 'POST';
        const path = `/api/pages/${body.id ? `${body.id}/` : ''}`;
        return sendRequest(method, path, body);
    });

    return {
        ...result,
        mutate: (variables, { onSuccess, ...options }) =>
            mutate(variables, {
                ...options,
                onSuccess: async (...args) => {
                    await queryClient.invalidateQueries(['iaso', 'pages']);
                    onSuccess(...args);
                },
            }),
    };
};
