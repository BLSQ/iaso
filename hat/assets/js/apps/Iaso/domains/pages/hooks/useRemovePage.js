import { useMutation, useQueryClient } from 'react-query';
import { sendRequest } from './networking';

export const useRemovePage = () => {
    const queryClient = useQueryClient();

    const { mutate, ...result } = useMutation(slug =>
        sendRequest('DELETE', `/api/pages/${slug}`),
    );

    return {
        ...result,
        mutate: (variables, { onSuccess, ...options }) =>
            mutate(variables, {
                ...options,
                onSuccess: (...args) => {
                    queryClient.invalidateQueries(['iaso', 'pages']);
                    onSuccess(...args);
                },
            }),
    };
};
