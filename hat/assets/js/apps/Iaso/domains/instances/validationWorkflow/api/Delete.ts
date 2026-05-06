import { UseMutationResult } from 'react-query';
import { deleteRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { API_URL, WF_BASE_QUERYKEY } from '../constants';

const deleteWorkflow = (slug: string) => deleteRequest(`${API_URL}${slug}/`);

export const useDeleteWorkflow = (): UseMutationResult<any, any> => {
    return useSnackMutation({
        mutationFn: deleteWorkflow,
        invalidateQueryKey: WF_BASE_QUERYKEY,
    });
};

const deleteNode = ({
    workflowSlug,
    nodeSlug,
}: {
    workflowSlug: string;
    nodeSlug: string;
}) => deleteRequest(`${API_URL}${workflowSlug}/node-templates/${nodeSlug}/`);

export const useDeleteNode = (): UseMutationResult<any, any> => {
    return useSnackMutation({
        mutationFn: deleteNode,
        invalidateQueryKey: ['submission-workflows'],
    });
};
