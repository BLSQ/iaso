import { useCallback } from 'react';
import { UseMutationResult, useQueryClient } from 'react-query';
import { postRequest, patchRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import { SubTeam, User } from '../../../teams/types/team';
import { SaveAssignmentQuery } from '../../types/assigment';
import { AssignmentsResult } from './useGetAssignments';

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

type UseSaveAssignmentArgs = {
    planningId: string;
    assignments?: AssignmentsResult;
    selectedUser?: User;
    selectedTeam?: SubTeam;
};

type UseSaveAssignmentResult = UseMutationResult<
    unknown,
    unknown,
    SaveAssignmentQuery
> & {
    handleSaveAssignment: (orgUnitId: number) => void;
};

export const useSaveAssignment = ({
    planningId,
    assignments,
    selectedUser,
    selectedTeam,
}: UseSaveAssignmentArgs): UseSaveAssignmentResult => {
    const queryClient = useQueryClient();
    const onSuccess = () => {
        queryClient.invalidateQueries('orgUnits');
        queryClient.invalidateQueries('assignmentsList');
        queryClient.invalidateQueries('orgUnitsList');
    };
    const mutation = useSnackMutation<unknown, unknown, SaveAssignmentQuery>({
        mutationFn: (data: SaveAssignmentQuery) => saveAssignment(data),
        options: { onSuccess },
        showSuccessSnackBar: false,
    });
    const { mutateAsync } = mutation;
    const handleSaveAssignment = useCallback(
        (orgUnitId: number) => {
            const existingAssignment = assignments?.allAssignments?.find(
                assignment => assignment.org_unit === orgUnitId,
            );
            let payload: SaveAssignmentQuery | undefined;
            if (selectedUser) {
                payload = {
                    planning: parseInt(planningId, 10),
                    org_unit: orgUnitId,
                    id: existingAssignment?.id,
                    user:
                        existingAssignment &&
                        selectedUser?.id === existingAssignment.user
                            ? null
                            : selectedUser?.id,
                };
            } else if (selectedTeam) {
                payload = {
                    planning: parseInt(planningId, 10),
                    org_unit: orgUnitId,
                    id: existingAssignment?.id,
                    team:
                        existingAssignment &&
                        selectedTeam?.id === existingAssignment.team
                            ? null
                            : selectedTeam?.id,
                };
            } else if (!payload) {
                return;
            }

            mutateAsync(payload);
        },
        [
            assignments?.allAssignments,
            mutateAsync,
            planningId,
            selectedTeam,
            selectedUser,
        ],
    );
    return {
        ...mutation,
        handleSaveAssignment,
    };
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
        showSuccessSnackBar: false,
    });
};
