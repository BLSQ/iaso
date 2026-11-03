import { useMutation, useQueryClient } from 'react-query';
import {
    PatchedTeamUpdateRequest,
    TeamTree,
    apiTeamsPartialUpdate,
    useApiTeamsDestroy,
    useApiTeamsPartialUpdate,
} from 'Iaso/api/teams';
import { TEAM_QUERY_KEYS } from 'Iaso/domains/teams/constants';
import { getTeamTreeQueryKey } from 'Iaso/domains/teams/hooks/requests/useGetTeamTree';
import TEAM_MESSAGES from 'Iaso/domains/teams/messages';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { collectTeamTreeNodes, mapTeamTree } from 'Iaso/domains/teams/utils';
import { useCustomMutationOptions } from '../../../../../../orval/mutator/custom-mutation-options';

const userIds = (team: TeamTreeNode) => team.users.map(user => user.id);

type TeamChanges = Pick<Partial<TeamTreeNode>, 'name' | 'type' | 'parent'>;
type UpdateTeamVariables = { id: number; data?: PatchedTeamUpdateRequest };
type DeleteTeamVariables = { id: number };
type MoveUserVariables = {
    userId: number;
    from: TeamTreeNode;
    to?: TeamTreeNode;
};

const applyUpdateTeam = (
    root: TeamTreeNode,
    { id, data }: UpdateTeamVariables,
): TeamTreeNode | undefined => {
    const updatedTeam = collectTeamTreeNodes(root).find(team => team.id === id);
    if (!updatedTeam) return root;
    const changes = data as TeamChanges;
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
    { id }: DeleteTeamVariables,
): TeamTreeNode | undefined =>
    mapTeamTree(root, team => (team.id === id ? undefined : team));

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
            const previous = queryClient.getQueryData<TeamTree[]>(queryKey);
            if (previous) {
                queryClient.setQueryData(
                    queryKey,
                    (previous as TeamTreeNode[]).flatMap(
                        root => apply(root, variables) ?? [],
                    ),
                );
            }
            return { previous };
        },
        onError: (
            _error: unknown,
            _variables: Variables,
            context?: { previous?: TeamTree[] },
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
    useApiTeamsPartialUpdate({
        mutation: {
            ...useOptimisticHierarchyUpdate(rootTeamId, applyUpdateTeam),
            meta: { showSuccessSnackBar: false },
        },
    });

export const useDeleteHierarchyTeam = (rootTeamId?: number) =>
    useApiTeamsDestroy({
        mutation: {
            ...useOptimisticHierarchyUpdate(rootTeamId, applyDeleteTeam),
            meta: {
                snackSuccessMessage: TEAM_MESSAGES.deleteSuccess,
                snackErrorMsg: TEAM_MESSAGES.deleteError,
            },
        },
    });

// Without a target team, the user is only removed from its current team.
export const useMoveUser = (rootTeamId?: number) =>
    useMutation(
        useCustomMutationOptions({
            mutationFn: async ({ userId, from, to }: MoveUserVariables) => {
                // Add before removing so a failure never leaves the user without a team.
                if (to) {
                    await apiTeamsPartialUpdate(to.id, {
                        users: [...userIds(to), userId],
                    });
                }
                return apiTeamsPartialUpdate(from.id, {
                    users: userIds(from).filter(id => id !== userId),
                });
            },
            ...useOptimisticHierarchyUpdate(rootTeamId, applyMoveUser),
            meta: { showSuccessSnackBar: false },
        }),
    );
