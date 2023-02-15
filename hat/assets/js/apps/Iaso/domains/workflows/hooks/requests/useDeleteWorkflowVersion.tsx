import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

const deleteWorkflowVersion = async (versionId: string): Promise<any> => {
    return deleteRequest(`/api/workflowversions/${versionId}/`);
};
export const useDeleteWorkflowVersion = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteWorkflowVersion,
        invalidateQueryKey: 'workflowVersions',
    });
