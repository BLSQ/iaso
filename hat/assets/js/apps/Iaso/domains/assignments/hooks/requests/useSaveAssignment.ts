import { UseMutationResult } from 'react-query';
import { postRequest, patchRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import { SaveAssignmentQuery } from '../../types/assigment';

const endpoint = '/api/microplanning/assignments/';

const patchAssignment = async (body: Partial<SaveAssignmentQuery>) => {
    const url = `${endpoint}${body.id}/`;
    return patchRequest(url, body);
};

const postAssigmnent = async (body: SaveAssignmentQuery) => {
    return postRequest(endpoint, body);
};

export const useSaveAssignment = (
    type: 'create' | 'edit',
    callback: () => void = () => null,
): UseMutationResult => {
    const onSuccess = () => callback();
    const editAssignment = useSnackMutation(
        (data: Partial<SaveAssignmentQuery>) => patchAssignment(data),
        undefined,
        undefined,
        ['assignmentsList'],
        { onSuccess },
        true,
    );
    const createAssignment = useSnackMutation(
        (data: SaveAssignmentQuery) => postAssigmnent(data),
        undefined,
        undefined,
        ['assignmentsList'],
        { onSuccess },
        true,
    );
    switch (type) {
        case 'create':
            return createAssignment;
        case 'edit':
            return editAssignment;
        default:
            throw new Error(
                `wrong type expected: create, copy or edit, got:  ${type} `,
            );
    }
};
