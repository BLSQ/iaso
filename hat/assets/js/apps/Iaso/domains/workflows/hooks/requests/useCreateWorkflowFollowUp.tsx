import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import { FollowUps } from '../../types/workflows';

const createWorkflowFollowUp = async (data: FollowUps): Promise<any> => {
    return postRequest('/api//api/workflowfollowups/bulkupdate//', data);
};

export const useCreateWorkflowFollowUp = (
    closeDialog: () => void,
): UseMutationResult =>
    useSnackMutation({
        mutationFn: createWorkflowFollowUp,
        invalidateQueryKey: 'workflowVersions',
        options: { onSuccess: () => closeDialog() },
    });
