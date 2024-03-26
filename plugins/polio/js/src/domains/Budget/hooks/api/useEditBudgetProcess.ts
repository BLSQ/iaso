import { UseMutationResult } from 'react-query';

import { patchRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const editBudgetProcess = async (payload: any): Promise<any> => {
    const rounds: string[] = payload.rounds.split(',');
    return patchRequest(`/api/polio/budget/${payload.id}/`, { rounds });
};

export const useEditBudgetProcess = (
    invalidateQueryKey = 'budget',
    onSuccess: () => void = () => undefined,
): UseMutationResult =>
    useSnackMutation({
        mutationFn: editBudgetProcess,
        invalidateQueryKey,
        options: {
            onSuccess,
        },
    });
