import { useCallback, useMemo } from 'react';
import { useQueryClient } from 'react-query';
import {
    PaginatedAssignmentOrgUnitListOutput,
    apiMicroplanningPlanningsAssignmentsAssignCreate,
    apiMicroplanningPlanningsAssignmentsUnassignCreate,
} from 'Iaso/api/assignments';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { Assignment } from '../mainPanel/types';
import {
    getAssignments,
    getPlanningAssignmentsQueryKey,
} from './usePlanningAssignments';
import {
    AssigneeRef,
    applyAssignmentChange,
    getChangedOrgUnitIds,
} from './utils';

type AssignmentChange = {
    orgUnitIds: number[];
    // Without an assignee, the org units are unassigned.
    assignee?: AssigneeRef;
};

type MutationVariables = AssignmentChange & {
    nextAssignments: Assignment[];
};

type CachedAssignments = PaginatedAssignmentOrgUnitListOutput | undefined;

type MutationContext = {
    previousData: CachedAssignments;
};

export type UpdateAssignments = (change: AssignmentChange) => void;

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
        mutationFn: ({ orgUnitIds, assignee }: MutationVariables) =>
            assignee
                ? apiMicroplanningPlanningsAssignmentsAssignCreate(
                      `${planningId}`,
                      { org_unit_ids: orgUnitIds, ...assignee },
                  )
                : apiMicroplanningPlanningsAssignmentsUnassignCreate(
                      `${planningId}`,
                      { org_unit_ids: orgUnitIds },
                  ),
        showSuccessSnackBar: false,
        useApiErrorMessage: true,
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
            const changedOrgUnitIds = getChangedOrgUnitIds(
                assignments,
                orgUnitIds,
                assignee,
            );
            if (!changedOrgUnitIds.length) return;
            mutate({
                orgUnitIds: changedOrgUnitIds,
                assignee,
                nextAssignments: applyAssignmentChange(
                    assignments,
                    changedOrgUnitIds,
                    assignee,
                ),
            });
        },
        [queryClient, queryKey, mutate],
    );
};
