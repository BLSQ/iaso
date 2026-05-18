import { useMemo } from 'react';
import { UseMutationResult } from 'react-query';
import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { API_URL } from '../../../validationWorkflowsConfiguration/constants';

type CompleteNodeBody =
    | {
          comment?: string;
          approved: true;
      }
    | { approved: false; comment: string };

type CompleteNodeByPassBody =
    | {
          comment?: string;
          approved: true;
          node: string;
      }
    | { approved: false; comment: string; node: string };

const completeNode =
    (instanceId: number, nodeId: number) => (body: CompleteNodeBody) =>
        postRequest(
            `${API_URL}instance/${instanceId}/nodes/${nodeId}/complete/`,
            body,
        );
const completeNodeByPass =
    (instanceId: number) => (body: CompleteNodeByPassBody) =>
        postRequest(
            `${API_URL}instance/${instanceId}/nodes/complete-bypass/`,
            body,
        );

export const useCompleteNode = (
    instanceId: number,
    nodeId: number,
): UseMutationResult<any, any> => {
    const save = useMemo(
        () => completeNode(instanceId, nodeId),
        [instanceId, nodeId],
    );
    return useSnackMutation({
        mutationFn: save,
        invalidateQueryKey: [
            'instance',
            'submission-validation-status',
            instanceId,
        ],
    });
};

export const useCompleteNodeByPass = (
    instanceId: number,
): UseMutationResult<any, any> => {
    const save = useMemo(() => completeNodeByPass(instanceId), [instanceId]);
    return useSnackMutation({
        mutationFn: save,
        invalidateQueryKey: [
            'instance',
            'submission-validation-status',
            instanceId,
        ],
    });
};
