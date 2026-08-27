import React from 'react';
import { UseMutationResult } from 'react-query';
import {
    getApiValidationWorkflowsListQueryKey,
    getApiValidationWorkflowsRetrieveQueryKey,
} from 'Iaso/api/validationWorkflows';
import { deleteRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { API_URL, WF_BASE_QUERYKEY } from '../constants';

const deleteNode = ({
    workflowSlug,
    nodeSlug,
}: {
    workflowSlug: string;
    nodeSlug: string;
}) => deleteRequest(`${API_URL}${workflowSlug}/node-templates/${nodeSlug}/`);

export const useDeleteNode = (
    workflowSlug?: string,
): UseMutationResult<any, any> => {
    const queryKey = React.useMemo(() => {
        return [
            ...getApiValidationWorkflowsListQueryKey(),
            ...(workflowSlug
                ? getApiValidationWorkflowsRetrieveQueryKey(workflowSlug)
                : []),
        ] as string[];
    }, [workflowSlug]);

    return useSnackMutation({
        mutationFn: deleteNode,
        invalidateQueryKey: [...queryKey, WF_BASE_QUERYKEY],
    });
};
