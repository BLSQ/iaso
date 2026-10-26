import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { collectTeamTreeNodes } from 'Iaso/domains/teams/utils';
import { Assignment } from './types';

export const getAssigneeColorByOrgUnitId = (
    tree: TeamTreeNode,
    assignments: Assignment[],
): Map<number, string> => {
    const teams = collectTeamTreeNodes(tree);
    const teamColors = new Map(teams.map(team => [team.id, team.color]));
    const userColors = new Map(
        teams.flatMap(team => team.users.map(user => [user.id, user.color])),
    );
    const colors = new Map<number, string>();
    assignments.forEach(({ org_unit, team, user }) => {
        const color = team
            ? teamColors.get(team)
            : user && userColors.get(user);
        if (color) colors.set(org_unit, color);
    });
    return colors;
};
