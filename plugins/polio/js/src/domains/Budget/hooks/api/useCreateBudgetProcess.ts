import { UseMutationResult } from 'react-query';

import { postRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import MESSAGES from '../../messages';

export const useCreateBudgetProcess = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: body =>
            postRequest('/api/polio/budget/', {
                ...body,
                rounds: body.rounds.map(round => ({
                    id: round.id,
                    cost: round.cost,
                })),
            }),
        snackSuccessMessage: MESSAGES.messageCreateSuccess,
        invalidateQueryKey: 'budget',
    });
};
