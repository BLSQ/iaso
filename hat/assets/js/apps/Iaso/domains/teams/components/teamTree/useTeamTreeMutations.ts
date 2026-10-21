import { useQueryClient } from 'react-query';
import { TEAM_QUERY_KEYS } from 'Iaso/domains/teams/constants';
import { deleteTeam } from 'Iaso/domains/teams/hooks/requests/useDeleteTeam';
import { getTeamTreeQueryKey } from 'Iaso/domains/teams/hooks/requests/useGetTeamTree';
import { patchTeam } from 'Iaso/domains/teams/hooks/requests/useSaveTeam';
import TEAM_MESSAGES from 'Iaso/domains/teams/messages';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { mapTeamTree, normalizeTeamTree } from 'Iaso/domains/teams/utils';
import { useSnackMutation } from 'Iaso/libs/apiHooks';

const userIds = (team: TeamTreeNode) => team.users.map(user => user.id);

type TeamChanges = Pick<Partial<TeamTreeNode>, 'name' | 'type' | 'parent'>;
type UpdateTeamVariables = { team: TeamTreeNode; changes: TeamChanges };
type MoveUserVariables = {
    userId: number;
    from: TeamTreeNode;
    to?: TeamTreeNode;
};

const applyUpdateTeam = (
    root: TeamTreeNode,
    { team: updatedTeam, changes }: UpdateTeamVariables,
): TeamTreeNode | undefined => {
    const isMove =
        changes.parent !== undefined && changes.parent !== updatedTeam.parent;
    return mapTeamTree(root, team => {
        if (team.id === updatedTeam.id) {
            return isMove ? undefined : { ...team, ...changes };
        }
        if (isMove && team.id === changes.parent) {
            const movedTeam = { ...updatedTeam, ...changes };
            return { ...team, children: [...team.children, movedTeam] };
        }
        return team;
    });
};

const applyDeleteTeam = (
    root: TeamTreeNode,
    teamId: number,
): TeamTreeNode | undefined =>
    mapTeamTree(root, team => (team.id === teamId ? undefined : team));

const applyMoveUser = (
    root: TeamTreeNode,
    { userId, from, to }: MoveUserVariables,
): TeamTreeNode | undefined => {
    const movedUser = from.users.find(user => user.id === userId);
    return mapTeamTree(root, team => {
        if (team.id === from.id) {
            return {
                ...team,
                users: team.users.filter(user => user.id !== userId),
            };
        }
        if (team.id === to?.id && movedUser) {
            return {
                ...team,
                users: [...team.users, movedUser],
            };
        }
        return team;
    });
};

// Updates the cached hierarchy right away so drag & drop feels instant, and rolls back on error.
const useOptimisticHierarchyUpdate = <Variables>(
    rootTeamId: number | undefined,
    apply: (
        root: TeamTreeNode,
        variables: Variables,
    ) => TeamTreeNode | undefined,
) => {
    const queryClient = useQueryClient();
    const queryKey = getTeamTreeQueryKey(rootTeamId);
    return {
        onMutate: async (variables: Variables) => {
            await queryClient.cancelQueries(queryKey);
            const previous = queryClient.getQueryData<TeamTreeNode>(queryKey);
            if (previous) {
                const next = apply(previous, variables);
                queryClient.setQueryData(
                    queryKey,
                    next && normalizeTeamTree(next),
                );
            }
            return { previous };
        },
        onError: (
            _error: unknown,
            _variables: Variables,
            context?: { previous?: TeamTreeNode },
        ) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKey, context.previous);
            }
        },
        // Other team lists and dropdowns don't refetch on their own.
        onSettled: () =>
            TEAM_QUERY_KEYS.forEach(key => queryClient.invalidateQueries(key)),
    };
};

export const useUpdateTeam = (rootTeamId?: number) =>
    useSnackMutation({
        mutationFn: ({ team, changes }: UpdateTeamVariables) =>
            patchTeam({ id: team.id, ...changes }),
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
