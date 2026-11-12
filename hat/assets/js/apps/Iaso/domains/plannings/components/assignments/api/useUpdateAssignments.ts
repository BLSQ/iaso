import { useCallback, useMemo } from 'react';
import { useQueryClient } from 'react-query';
import {
    PaginatedAssignmentOrgUnitListOutput,
    apiMicroplanningAssignmentsCreate,
    apiMicroplanningAssignmentsDestroy,
    apiMicroplanningAssignmentsPartialUpdate,
} from 'Iaso/api/assignments';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { Assignment } from '../mainPanel/types';
import {
    getAssignments,
    getPlanningAssignmentsQueryKey,
} from './usePlanningAssignments';
import {
    AssigneeRef,
    AssignmentRequest,
    applyAssignmentChange,
    getAssignmentRequests,
} from './utils';

type MutationVariables = {
    requests: AssignmentRequest[];
    nextAssignments: Assignment[];
};

type CachedAssignments = PaginatedAssignmentOrgUnitListOutput | undefined;

type MutationContext = {
    previousData: CachedAssignments;
};

export type UpdateAssignments = (change: {
    orgUnitIds: number[];
    // Without an assignee, the org units are unassigned.
    assignee?: AssigneeRef;
}) => void;

// Temporary: one request per org unit on the generic assignment endpoints, until the planning assignment endpoints exist.
const sendRequest = (planningId: number, request: AssignmentRequest) => {
    switch (request.kind) {
        case 'create':
            return apiMicroplanningAssignmentsCreate({
                planning: planningId,
                org_unit: request.orgUnitId,
                ...request.assignee,
            });
        case 'update':
            return apiMicroplanningAssignmentsPartialUpdate(
                request.assignmentId,
                request.assignee,
            );
        case 'delete':
            return apiMicroplanningAssignmentsDestroy(request.assignmentId);
        default:
            throw new Error('Unknown assignment request');
    }
};

// Applied to the page right away, rolled back if the server refuses it.
export const useUpdateAssignments = (planningId: number): UpdateAssignments => {
    const queryClient = useQueryClient();
    const queryKey = useMemo(
        () => getPlanningAssignmentsQueryKey(planningId),
        [planningId],
    );

    const { mutate } = useSnackMutation<
        unknown,
        unknown,
        MutationVariables,
        MutationContext
    >({
        mutationFn: ({ requests }: MutationVariables) =>
            Promise.all(
                requests.map(request => sendRequest(planningId, request)),
            ),
        showSuccessSnackBar: false,
        options: {
            onMutate: async ({ nextAssignments }) => {
                await queryClient.cancelQueries(queryKey);
                const previousData =
                    queryClient.getQueryData<CachedAssignments>(queryKey);
                queryClient.setQueryData<CachedAssignments>(
                    queryKey,
                    data => data && { ...data, results: nextAssignments },
                );
                return { previousData };
            },
            onError: (_error, _variables, context) => {
                queryClient.setQueryData(queryKey, context?.previousData);
            },
            onSettled: () => queryClient.invalidateQueries(queryKey),
        },
    });

    return useCallback<UpdateAssignments>(
        ({ orgUnitIds, assignee }) => {
            const assignments = getAssignments(
                queryClient.getQueryData<CachedAssignments>(queryKey),
            );
            const requests = getAssignmentRequests(
                assignments,
                orgUnitIds,
                assignee,
            );
            if (!requests.length) return;
            mutate({
                requests,
                nextAssignments: applyAssignmentChange(
                    assignments,
                    orgUnitIds,
                    assignee,
                ),
            });
        },
        [queryClient, queryKey, mutate],
    );
};
