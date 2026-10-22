import { TeamTreeNode } from 'Iaso/domains/teams/types/team';

export const getTeamChain = (
    root: TeamTreeNode,
    teamId: number,
): TeamTreeNode[] => {
    if (root.id === teamId) return [root];
    for (const child of root.children) {
        const chain = getTeamChain(child, teamId);
        if (chain.length) return [root, ...chain];
    }
    return [];
};
