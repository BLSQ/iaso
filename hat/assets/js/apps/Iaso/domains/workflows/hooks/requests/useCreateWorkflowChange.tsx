import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import { FollowUps } from '../../types/workflows';

const createWorkflowChange = async (
    data: FollowUps,
    versionId: string,
): Promise<any> => {
    return postRequest(`/api/workflowchanges/?version_id=${versionId}`, data);
};

export const useCreateWorkflowChange = (
    closeDialog: () => void,
    versionId: string,
): UseMutationResult =>
    useSnackMutation({
        mutationFn: data => createWorkflowChange(data, versionId),
        invalidateQueryKey: 'workflowVersion',
        options: { onSuccess: () => closeDialog() },
    });
