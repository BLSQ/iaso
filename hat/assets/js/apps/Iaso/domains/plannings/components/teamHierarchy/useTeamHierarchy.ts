import { useCallback } from 'react';
import { QueryKey, UseQueryResult, useQueryClient } from 'react-query';
import { deleteTeam } from 'Iaso/domains/teams/hooks/requests/useDeleteTeam';
import { patchTeam } from 'Iaso/domains/teams/hooks/requests/useSaveTeam';
import TEAM_MESSAGES from 'Iaso/domains/teams/messages';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { HierarchyTeam } from './types';

const HIERARCHY_FIELDS = 'id,name,type,parent,color,project,users_details';

const OTHER_TEAM_QUERY_KEYS = ['teamsList', 'teamsDropdown', 'team'];

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

type TeamChanges = Pick<Partial<HierarchyTeam>, 'name' | 'type' | 'parent'>;
type UpdateTeamVariables = { teamId: number; changes: TeamChanges };
type MoveUserVariables = {
    userId: number;
    from: HierarchyTeam;
    to?: HierarchyTeam;
};

const applyUpdateTeam = (
    teams: HierarchyTeam[],
    { teamId, changes }: UpdateTeamVariables,
): HierarchyTeam[] =>
    teams.map(team => (team.id === teamId ? { ...team, ...changes } : team));

const applyDeleteTeam = (
    teams: HierarchyTeam[],
    teamId: number,
): HierarchyTeam[] => teams.filter(team => team.id !== teamId);

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
        onSettled: () => {
            queryClient.invalidateQueries(queryKey);
            // Team dropdowns (e.g. the root team select) never go stale on their own.
            OTHER_TEAM_QUERY_KEYS.forEach(key =>
                queryClient.invalidateQueries(key),
            );
        },
    };
};

export const useUpdateTeam = (rootTeamId?: number) =>
    useSnackMutation({
        mutationFn: ({ teamId, changes }: UpdateTeamVariables) =>
            patchTeam({ id: teamId, ...changes }),
        showSuccessSnackBar: false,
        options: useOptimisticHierarchyUpdate(rootTeamId, applyUpdateTeam),
    });

export const useDeleteHierarchyTeam = (rootTeamId?: number) =>
    useSnackMutation({
        mutationFn: deleteTeam,
        snackSuccessMessage: TEAM_MESSAGES.deleteSuccess,
        snackErrorMsg: TEAM_MESSAGES.deleteError,
        options: useOptimisticHierarchyUpdate(rootTeamId, applyDeleteTeam),
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
