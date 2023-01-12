import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

const deleteWorkflowFollowUp = async (followUpId: number): Promise<any> => {
    return deleteRequest(`/api/workflowfollowups/${followUpId}/`);
};
export const useDeleteWorkflowFollowUp = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteWorkflowFollowUp,
        invalidateQueryKey: 'workflowVersion',
    });
