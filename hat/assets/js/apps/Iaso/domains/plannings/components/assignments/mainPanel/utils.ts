import { PlanningLevelTreeNode } from 'Iaso/api/plannings';
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

// Points are only drawn on the level assigned to users.
export const countOrgUnitsOffMap = (
    levelTree: PlanningLevelTreeNode[],
    level: number,
    showPoints: boolean,
): number =>
    levelTree.filter(
        node =>
            node.level === level &&
            !node.has_geo_json &&
            !(showPoints && node.has_location),
    ).length;

// Only assignments to a team: users can't be opened.
export const getTeamIdByOrgUnitId = (
    assignments: Assignment[],
): Map<number, number> =>
    new Map(
        assignments.flatMap(({ org_unit, team }) =>
            team ? [[org_unit, team]] : [],
        ),
    );
