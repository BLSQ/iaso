import { UseMutationResult } from 'react-query';
import { deleteRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { API_URL } from '../constants';

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
