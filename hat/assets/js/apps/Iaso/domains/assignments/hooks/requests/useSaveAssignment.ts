import { UseMutationResult, useQueryClient } from 'react-query';
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

export const useSaveAssignment = (): UseMutationResult => {
    const queryClient = useQueryClient();
    const onSuccess = () => {
        queryClient.invalidateQueries('orgUnits');
        queryClient.invalidateQueries('assignmentsList');
        queryClient.invalidateQueries('orgUnitsList');
    };
    return useSnackMutation({
        mutationFn: (data: SaveAssignmentQuery) => saveAssignment(data),
        options: { onSuccess },
        showSucessSnackBar: false,
    });
};

const saveBulkAssignments = (data: SaveAssignmentQuery) => {
    const url = `${endpoint}bulk_create_assignments/`;
    return postRequest(url, data);
};

export const useBulkSaveAssignments = (): UseMutationResult => {
    const queryClient = useQueryClient();
    const onSuccess = () => {
        queryClient.invalidateQueries('orgUnits');
        queryClient.invalidateQueries('assignmentsList');
        queryClient.invalidateQueries('orgUnitsList');
    };
    return useSnackMutation({
        mutationFn: saveBulkAssignments,
        options: { onSuccess },
        showSucessSnackBar: false,
    });
};
