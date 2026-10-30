import { teamKey, userKey } from 'Iaso/domains/teams/components/teamTree/utils';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { getDisplayName } from 'Iaso/utils/usersUtils';

export type TeamMember = {
    key: string;
    name: string;
    color: string;
    // Only sub-teams can be opened; users have none.
    team?: TeamTreeNode;
};

export const getTeamMembers = (team: TeamTreeNode): TeamMember[] => [
    ...team.children.map(child => ({
        key: teamKey(child.id),
        name: child.name,
        color: child.color,
        team: child,
    })),
    ...team.users.map(user => ({
        key: userKey(team.id, user.id),
        name: getDisplayName(user),
        color: user.color,
    })),
];

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
