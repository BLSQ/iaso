import { UseMutationResult } from 'react-query';
import { deleteRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { getNodeTemplatesUrl } from '../constants';
import { useNodeInvalidationQueryKey } from './PostPutPatch';

const deleteNode = ({
    workflowSlug,
    nodeSlug,
}: {
    workflowSlug: string;
    nodeSlug: string;
}) => deleteRequest(getNodeTemplatesUrl(workflowSlug, nodeSlug));

export const useDeleteNode = (
    workflowSlug?: string,
): UseMutationResult<any, any> => {
    const invalidateQueryKey = useNodeInvalidationQueryKey(workflowSlug);
    return useSnackMutation({
        mutationFn: deleteNode,
        invalidateQueryKey,
    });
};
