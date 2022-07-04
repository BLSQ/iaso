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
    showSucessSnackBar = true,
    callback: () => void = () => null,
): UseMutationResult => {
    const onSuccess = () => callback();
    return useSnackMutation(
        (data: SaveAssignmentQuery) => saveAssignment(data),
        undefined,
        undefined,
        ['assignmentsList'],
        { onSuccess },
        showSucessSnackBar,
    );
};

const saveBulkAssignments = (data: SaveAssignmentQuery) => {
    // IA-1421: workaround to avoid sending a request if all children org units are already selected (in which case the compoenent sets both team and user to null)
    // TODO clarify expected behaviour ^^
    if (data.team === null && data.user === null) {
        return new Promise(() => null);
    }
    const url = `${endpoint}bulk_create_assignments/`;
    return postRequest(url, data);
};

export const useBulkSaveAssignments = (
    showSucessSnackBar = true,
    callback: () => void = () => null,
): UseMutationResult => {
    const onSuccess = () => callback();
    return useSnackMutation({
        mutationFn: saveBulkAssignments,
        invalidateQueryKey: ['assignmentsList'],
        options: { onSuccess },
        showSucessSnackBar,
    });
};
