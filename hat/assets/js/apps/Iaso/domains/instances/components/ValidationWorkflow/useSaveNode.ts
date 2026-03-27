import { useMemo } from 'react';
import { UseMutationResult } from 'react-query';
import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { API_URL } from '../../validationWorkflow/constants';

// ToDO replace with complete / complete_bypass
const saveNode =
    ({ instanceId, nodeId }: { instanceId: number; nodeId?: number }) =>
    body => {
        const formattedBody = { ...body, approved: body.approved === 'true' };
        if (nodeId) {
            const { node: _node, ...payload } = formattedBody;
            return postRequest(
                `${API_URL}instance/${instanceId}/nodes/${nodeId}/complete/`,
                payload,
            );
        }
        return postRequest(
            `${API_URL}instance/${instanceId}/nodes/complete-bypass/`,
            formattedBody,
        );
    };

export const useSaveNode = ({
    instanceId,
    nodeId,
}: {
    instanceId: number;
    nodeId?: number;
}): UseMutationResult<any, any> => {
    const save = useMemo(
        () => saveNode({ instanceId, nodeId }),
        [instanceId, nodeId],
    );
    return useSnackMutation({
        mutationFn: save,
        invalidateQueryKey: ['instance', instanceId],
    });
};
