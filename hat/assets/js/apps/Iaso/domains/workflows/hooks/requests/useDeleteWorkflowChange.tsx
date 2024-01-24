import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import MESSAGES from '../../messages';
const deleteWorkflowChange = async (changeId: number): Promise<any> => {
    return deleteRequest(`/api/workflowchanges/${changeId}/`);
};
export const useDeleteWorkflowChange = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteWorkflowChange,
        invalidateQueryKey: ['workflowVersions','workflowVersionsChanges'],
        snackSuccessMessage: MESSAGES.changeDeleted,
    });
