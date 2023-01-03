import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

const deleteWorkflowChange = async (changeId: number): Promise<any> => {
    return deleteRequest(`/api/workflowchange/${changeId}/`);
};
export const useDeleteWorkflowChange = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteWorkflowChange,
        invalidateQueryKey: 'workflowVersion',
    });
