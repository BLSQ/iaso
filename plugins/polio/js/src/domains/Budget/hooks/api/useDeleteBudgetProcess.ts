import { UseMutationResult } from 'react-query';

import { deleteRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import MESSAGES from '../../messages';

const deleteBudgetProcess = (id: number) => {
    return deleteRequest(`/api/polio/budget/${id}`);
};

export const useDeleteBudgetProcess = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteBudgetProcess,
        snackSuccessMessage: MESSAGES.messageDeleteSuccess,
        invalidateQueryKey: 'budget',
    });
