import { UseMutationResult } from 'react-query';
import { postRequest, patchRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import { SaveAssignmentQuery } from '../../types/assigment';

const endpoint = '/api/microplanning/assignments/';

export const saveAssignment = async (
    body: SaveAssignmentQuery,
): Promise<any> => {
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
    return useSnackMutation({
        mutationFn: (data: SaveAssignmentQuery) => saveAssignment(data),
        invalidateQueryKey: ['assignmentsList'],
        options: { onSuccess },
        showSucessSnackBar: false,
    });
};

const saveBulkAssignments = (data: SaveAssignmentQuery) => {
    const url = `${endpoint}bulk_create_assignments/`;
    return postRequest(url, data);
};

export const useBulkSaveAssignments = (
    callback: () => void = () => null,
): UseMutationResult => {
    const onSuccess = () => callback();
    return useSnackMutation({
        mutationFn: saveBulkAssignments,
        invalidateQueryKey: ['assignmentsList'],
        options: { onSuccess },
        showSucessSnackBar: false,
    });
};
