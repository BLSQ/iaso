import { UseMutationResult } from 'react-query';
import { API_URL } from 'Iaso/domains/validationWorkflowsConfiguration/constants';
import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import {
    CompleteNodeBody,
    CompleteNodeByPassBody,
} from '../../components/ValidationWorkflow/useSaveNode';

type Body = (CompleteNodeBody | CompleteNodeByPassBody) & {
    node: string | undefined;
    nodeId: string;
    instanceId: string;
};

const saveNode = (body: Body) => {
    const { instanceId, node, nodeId, ...payload } = body;
    if (node) {
        return postRequest(
            `${API_URL}instance/${instanceId}/nodes/complete-bypass/`,
            { ...payload, node },
        );
    }
    return postRequest(
        `${API_URL}instance/${instanceId}/nodes/${nodeId}/complete/`,
        payload,
    );
};

export const useValidateNode = (): UseMutationResult<any, any> => {
    return useSnackMutation({
        mutationFn: saveNode,
        invalidateQueryKey: ['instance', 'submission-validation-status'],
    });
};
