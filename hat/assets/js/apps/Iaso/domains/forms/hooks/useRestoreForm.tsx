import { UseMutationResult } from 'react-query';
import { restoreRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import MESSAGES from '../messages';

const restoreForm = (id: number) => {
    return restoreRequest(`/api/forms/${id}/?only_deleted=1`);
};

export const useRestoreForm = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: restoreForm,
        snackSuccessMessage: MESSAGES.formRestored,
        invalidateQueryKey: ['forms'],
    });
};
