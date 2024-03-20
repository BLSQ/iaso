import { UseMutationResult, useQueryClient } from 'react-query';

import { postRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

export const useCreateBudgetProcess = (): UseMutationResult => {
    const queryClient = useQueryClient();
    return useSnackMutation({
        mutationFn: body =>
            postRequest('/api/polio/budget/', {
                rounds: body.rounds.split(','),
            }),
        options: {
            onSuccess: () => {
                queryClient.invalidateQueries('budget');
            },
        },
    });
};
