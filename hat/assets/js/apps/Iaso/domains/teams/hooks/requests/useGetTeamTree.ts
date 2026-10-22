import { useCallback } from 'react';
import { UseQueryResult } from 'react-query';
import {
    ApiTeamsTreeListParams,
    TeamTree,
    getApiTeamsTreeListQueryKey,
    useApiTeamsTreeList,
} from 'Iaso/api/teams';
import { TeamTreeNode } from '../../types/team';
import { normalizeTeamTree } from '../../utils';

const getTeamTreeParams = (rootTeamId?: number): ApiTeamsTreeListParams => ({
    root: rootTeamId?.toString(),
});

export const getTeamTreeQueryKey = (rootTeamId?: number) =>
    getApiTeamsTreeListQueryKey(getTeamTreeParams(rootTeamId));

export const useGetTeamTree = (
    rootTeamId?: number,
): UseQueryResult<TeamTreeNode | undefined> => {
    const selectRoot = useCallback(
        (roots: TeamTree[]) => {
            const root = (roots as TeamTreeNode[]).find(
                ({ id }) => id === rootTeamId,
            );
            return root && normalizeTeamTree(root);
        },
        [rootTeamId],
    );
    return useApiTeamsTreeList(getTeamTreeParams(rootTeamId), {
        query: {
            enabled: Boolean(rootTeamId),
            select: selectRoot,
        },
    });
};
