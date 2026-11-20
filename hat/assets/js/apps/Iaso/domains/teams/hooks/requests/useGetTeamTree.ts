import { useCallback } from 'react';
import { UseQueryResult } from 'react-query';
import {
    getApiTeamsTreeListQueryKey,
    useApiTeamsTreeList,
} from 'Iaso/api/teams/endpoints/teams/teams';
import { ApiTeamsTreeListParams } from 'Iaso/api/teams/models/apiTeamsTreeListParams.zod';
import { TeamTree } from 'Iaso/api/teams/models/teamTree.zod';
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
