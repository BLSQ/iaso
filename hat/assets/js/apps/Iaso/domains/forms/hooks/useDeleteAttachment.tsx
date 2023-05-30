import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

const deleteAttachment = (id: number) =>
    deleteRequest(`/api/formattachments/${id}`);

export const useDeleteAttachment = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: deleteAttachment,
        invalidateQueryKey: ['formAttachments'],
    });
};
