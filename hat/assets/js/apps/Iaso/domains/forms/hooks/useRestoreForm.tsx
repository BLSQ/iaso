import { UseMutationResult, useQueryClient } from 'react-query';
import { restoreRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import MESSAGES from '../messages';

const restoreForm = (id: number) => {
    return restoreRequest(`/api/forms/${id}/?only_deleted=1`);
};

export const useRestoreForm = (): UseMutationResult => {
    const queryClient = useQueryClient();
    return useSnackMutation({
        mutationFn: restoreForm,
        snackSuccessMessage: MESSAGES.formRestored,
        invalidateQueryKey: ['forms'],
        options: {
            onSuccess: (_, variables: number) => {
                queryClient.invalidateQueries([`form-${variables}`]);
            },
        },
    });
};
