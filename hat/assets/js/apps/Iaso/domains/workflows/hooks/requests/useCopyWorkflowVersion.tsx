import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

const copyWorkflowVersion = async (versionId: string): Promise<any> => {
    return postRequest(`/api/workflowversions/${versionId}/copy/`);
};
export const useCopyWorkflowVersion = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: copyWorkflowVersion,
        invalidateQueryKey: 'workflowVersions',
    });
