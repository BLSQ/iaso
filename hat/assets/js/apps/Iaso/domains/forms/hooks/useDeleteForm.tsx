import { UseMutationResult, useQueryClient } from 'react-query';
import { deleteRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import MESSAGES from '../messages';

const deleteForm = (id: number) => {
    return deleteRequest(`/api/forms/${id}/`);
};

export const useDeleteForm = (): UseMutationResult => {
    const queryClient = useQueryClient();
    return useSnackMutation({
        mutationFn: deleteForm,
        snackSuccessMessage: MESSAGES.formDeleted,
        invalidateQueryKey: ['forms'],
        options: {
            onSuccess: (_, variables: number) => {
                queryClient.invalidateQueries(['forms', variables]);
            },
        },
    });
};
