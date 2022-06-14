import { UseMutationResult } from 'react-query';
import { postRequest, patchRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import { SaveAssignmentQuery } from '../../types/assigment';

const endpoint = '/api/microplanning/assignments/';

const save = async (body: SaveAssignmentQuery) => {
    if (body.id) {
        const url = `${endpoint}${body.id}/`;
        return patchRequest(url, body);
    }
    return postRequest(endpoint, body);
};

export const useSaveAssignment = (
    callback: () => void = () => null,
): UseMutationResult => {
    const onSuccess = () => callback();
    return useSnackMutation(
        (data: SaveAssignmentQuery) => save(data),
        undefined,
        undefined,
        ['assignmentsList'],
        { onSuccess },
        true,
    );
};
