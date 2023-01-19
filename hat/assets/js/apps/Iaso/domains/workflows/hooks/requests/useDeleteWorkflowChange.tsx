import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

const deleteWorkflowChange = async (changeId: number): Promise<any> => {
    return deleteRequest(`/api/workflowchanges/${changeId}/`);
};
export const useDeleteWorkflowChange = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteWorkflowChange,
        invalidateQueryKey: 'workflowVersion',
        snackSuccessMessage: {
            id: 'iaso.snackBar.workflowChange.delete.success',
            defaultMessage: 'Workflow change deleted',
        },
    });
