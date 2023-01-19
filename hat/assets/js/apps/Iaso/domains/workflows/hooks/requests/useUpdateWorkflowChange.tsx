import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import { Change } from '../../types';

const updateWorkflowChange = async (data: Change): Promise<any> =>
    postRequest(`/api/workflowchanges/${data.id}/`, data);

export const useUpdateWorkflowChange = (
    onSuccess?: () => void,
): UseMutationResult =>
    useSnackMutation({
        mutationFn: (data: Change) => updateWorkflowChange(data),
        invalidateQueryKey: ['workflowVersion'],
        options: { onSuccess },
    });
