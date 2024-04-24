import { UseMutationResult } from 'react-query';

import { patchRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import MESSAGES from '../../messages';
import { BudgetDetail } from '../../types';

const editBudgetProcess = async (payload: BudgetDetail): Promise<any> => {
    return patchRequest(`/api/polio/budget/${payload.id}/`, {
        ...payload,
        rounds: payload.rounds.map(round => round.id),
    });
};

export const useEditBudgetProcess = (
    invalidateQueryKey = 'budget',
    onSuccess: () => void = () => undefined,
): UseMutationResult =>
    useSnackMutation({
        mutationFn: editBudgetProcess,
        snackSuccessMessage: MESSAGES.messageEditSuccess,
        invalidateQueryKey,
        options: {
            onSuccess,
        },
    });
