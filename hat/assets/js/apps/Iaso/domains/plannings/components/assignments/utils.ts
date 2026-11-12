import { teamKey, userKey } from 'Iaso/domains/teams/components/teamTree/utils';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { getDisplayName } from 'Iaso/utils/usersUtils';

export type TeamMember = {
    key: string;
    name: string;
    color: string;
    // Only sub-teams can be opened; users have none.
    team?: TeamTreeNode;
    userId?: number;
};

export type AssigneePick = {
    teamId: number;
    memberKey: string;
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
        userId: user.id,
    })),
];

// The picked member only counts in the team it was picked in: other teams start with their first member.
export const getCurrentAssignee = (
    team: TeamTreeNode,
    members: TeamMember[],
    picked?: AssigneePick,
): TeamMember | undefined =>
    (picked?.teamId === team.id &&
        members.find(member => member.key === picked.memberKey)) ||
    members[0];

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
