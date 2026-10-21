import { QueryKey, UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { TeamTreeNode } from '../../types/team';
import { normalizeTeamTree } from '../../utils';

export const getTeamTreeQueryKey = (rootTeamId?: number): QueryKey => [
    'teamTree',
    rootTeamId,
];

const getTeamTree = async (rootTeamId?: number) => {
    const roots: TeamTreeNode[] = await getRequest(
        makeUrlWithParams('/api/teams/tree/', { root: rootTeamId }),
    );
    const root = roots.find(({ id }) => id === rootTeamId);
    return root && normalizeTeamTree(root);
};

export const useGetTeamTree = (
    rootTeamId?: number,
): UseQueryResult<TeamTreeNode | undefined, Error> =>
    useSnackQuery({
        queryKey: getTeamTreeQueryKey(rootTeamId),
        queryFn: () => getTeamTree(rootTeamId),
        options: {
            enabled: Boolean(rootTeamId),
        },
    });
