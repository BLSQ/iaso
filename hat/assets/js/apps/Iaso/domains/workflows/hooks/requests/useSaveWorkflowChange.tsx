import { UseMutationResult } from 'react-query';
import { putRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import { Change } from '../../types';

const updateWorkflowChange = async (data: Change): Promise<any> =>
    putRequest(`/api/workflowchanges/${data.id}/`, data);

const createWorkflowChange = async (
    data: Change,
    versionId: string,
): Promise<any> => {
    return postRequest(`/api/workflowchanges/?version_id=${versionId}`, data);
};

export const useSaveWorkflowChange = (
    closeDialog: () => void,
    versionId: string,
): UseMutationResult =>
    useSnackMutation({
        mutationFn: data =>
            data.id
                ? updateWorkflowChange(data)
                : createWorkflowChange(data, versionId),
        invalidateQueryKey: ['workflowVersions','workflowVersionsChanges'],
        options: { onSuccess: () => closeDialog() },
    });
