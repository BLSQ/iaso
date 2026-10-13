import { useCallback } from 'react';
import { QueryKey, UseQueryResult, useQueryClient } from 'react-query';
import { patchTeam } from 'Iaso/domains/teams/hooks/requests/useSaveTeam';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { HierarchyTeam } from './types';

const HIERARCHY_FIELDS = 'id,name,type,parent,color,project,users_details';

const getHierarchyQueryKey = (rootTeamId?: number): QueryKey => [
    'planningTeamHierarchy',
    rootTeamId,
];

export const useGetTeamHierarchy = (
    rootTeamId?: number,
): UseQueryResult<HierarchyTeam[], Error> =>
    useSnackQuery({
        queryKey: getHierarchyQueryKey(rootTeamId),
        queryFn: () =>
            getRequest(
                makeUrlWithParams('/api/teams/', {
                    ancestor: rootTeamId,
                    fields: HIERARCHY_FIELDS,
                }),
            ),
        options: {
            enabled: Boolean(rootTeamId),
            keepPreviousData: true,
        },
    });

export const useRefreshTeamHierarchy = (rootTeamId?: number) => {
    const queryClient = useQueryClient();
    return useCallback(
        () => queryClient.invalidateQueries(getHierarchyQueryKey(rootTeamId)),
        [queryClient, rootTeamId],
    );
};

const userIds = (team: HierarchyTeam) =>
    (team.users_details ?? []).map(user => user.id);

type MoveTeamVariables = { teamId: number; parentId: number | null };
type MoveUserVariables = {
    userId: number;
    from: HierarchyTeam;
    to?: HierarchyTeam;
};

const applyMoveTeam = (
    teams: HierarchyTeam[],
    { teamId, parentId }: MoveTeamVariables,
): HierarchyTeam[] =>
    teams.map(team =>
        team.id === teamId ? { ...team, parent: parentId ?? undefined } : team,
    );

const applyMoveUser = (
    teams: HierarchyTeam[],
    { userId, from, to }: MoveUserVariables,
): HierarchyTeam[] => {
    const movedUser = from.users_details?.find(user => user.id === userId);
    return teams.map(team => {
        if (team.id === from.id) {
            return {
                ...team,
                users_details: team.users_details?.filter(
                    user => user.id !== userId,
                ),
            };
        }
        if (team.id === to?.id && movedUser) {
            return {
                ...team,
                users_details: [...(team.users_details ?? []), movedUser],
            };
        }
        return team;
    });
};

// Updates the cached hierarchy right away so drag & drop feels instant, and rolls back on error.
const useOptimisticHierarchyUpdate = <Variables>(
    rootTeamId: number | undefined,
    apply: (teams: HierarchyTeam[], variables: Variables) => HierarchyTeam[],
) => {
    const queryClient = useQueryClient();
    const queryKey = getHierarchyQueryKey(rootTeamId);
    return {
        onMutate: async (variables: Variables) => {
            await queryClient.cancelQueries(queryKey);
            const previous =
                queryClient.getQueryData<HierarchyTeam[]>(queryKey);
            if (previous) {
                queryClient.setQueryData(queryKey, apply(previous, variables));
            }
            return { previous };
        },
        onError: (
            _error: unknown,
            _variables: Variables,
            context?: { previous?: HierarchyTeam[] },
        ) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKey, context.previous);
            }
        },
        onSettled: () => queryClient.invalidateQueries(queryKey),
    };
};

export const useMoveTeam = (rootTeamId?: number) =>
    useSnackMutation({
        mutationFn: ({ teamId, parentId }: MoveTeamVariables) =>
            patchTeam({ id: teamId, parent: parentId }),
        showSuccessSnackBar: false,
        options: useOptimisticHierarchyUpdate(rootTeamId, applyMoveTeam),
    });

// Without a target team, the user is only removed from its current team.
export const useMoveUser = (rootTeamId?: number) =>
    useSnackMutation({
        mutationFn: async ({ userId, from, to }: MoveUserVariables) => {
            // Add before removing so a failure never leaves the user without a team.
            if (to) {
                await patchTeam({ id: to.id, users: [...userIds(to), userId] });
            }
            return patchTeam({
                id: from.id,
                users: userIds(from).filter(id => id !== userId),
            });
        },
        showSuccessSnackBar: false,
        options: useOptimisticHierarchyUpdate(rootTeamId, applyMoveUser),
    });
