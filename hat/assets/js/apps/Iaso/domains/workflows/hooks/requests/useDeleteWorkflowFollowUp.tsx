import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

const deleteWorkflowVersion = async (followUpId: number): Promise<any> => {
    return deleteRequest(`/api/workflowfollowups/${followUpId}/`);
};
export const useDeleteWorkflowVersion = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteWorkflowVersion,
        invalidateQueryKey: 'workflowVersions',
    });
