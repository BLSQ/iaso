import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import { FollowUps } from '../../types';

const createWorkflowFollowUp = async (
    data: FollowUps,
    versionId: string,
): Promise<any> => {
    return postRequest(`/api/workflowfollowups/?version_id=${versionId}`, data);
};

export const useCreateWorkflowFollowUp = (
    closeDialog: () => void,
    versionId: string,
): UseMutationResult =>
    useSnackMutation({
        mutationFn: data => createWorkflowFollowUp(data, versionId),
        invalidateQueryKey: 'workflowVersion',
        options: { onSuccess: () => closeDialog() },
    });
