import { UseMutationResult, useQueryClient } from 'react-query';

import { postRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import MESSAGES from '../../messages';

export const useCreateBudgetProcess = (): UseMutationResult => {
    const queryClient = useQueryClient();
    return useSnackMutation({
        mutationFn: body =>
            postRequest('/api/polio/budget/', {
                rounds: body.rounds.split(','),
            }),
        snackSuccessMessage: MESSAGES.messageCreateSuccess,
        options: {
            onSuccess: () => {
                queryClient.invalidateQueries('budget');
            },
        },
    });
};
