import { PlanningLevelTreeNode } from 'Iaso/api/plannings';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { collectTeamTreeNodes } from 'Iaso/domains/teams/utils';
import { getDisplayName } from 'Iaso/utils/usersUtils';
import { Assignee, Assignment, OrgUnitRow } from './types';

export const getAssigneeByOrgUnitId = (
    tree: TeamTreeNode,
    assignments: Assignment[],
): Map<number, Assignee> => {
    const teams = collectTeamTreeNodes(tree);
    const teamAssignees = new Map(
        teams.map(team => [team.id, { name: team.name, color: team.color }]),
    );
    const userAssignees = new Map(
        teams.flatMap(team =>
            team.users.map(user => [
                user.id,
                { name: getDisplayName(user), color: user.color },
            ]),
        ),
    );
    const assignees = new Map<number, Assignee>();
    assignments.forEach(({ org_unit, team, user }) => {
        const assignee = team
            ? teamAssignees.get(team)
            : user && userAssignees.get(user);
        if (assignee) assignees.set(org_unit, assignee);
    });
    return assignees;
};

export const getAssigneeColorByOrgUnitId = (
    tree: TeamTreeNode,
    assignments: Assignment[],
): Map<number, string> =>
    new Map(
        Array.from(
            getAssigneeByOrgUnitId(tree, assignments),
            ([orgUnitId, { color }]) => [orgUnitId, color],
        ),
    );

// Points are only drawn on the level assigned to users.
export const isOffMap = (
    node: PlanningLevelTreeNode,
    showPoints: boolean,
): boolean => !node.has_geo_json && !(showPoints && node.has_location);

export const countOrgUnitsOffMap = (
    levelTree: PlanningLevelTreeNode[],
    level: number,
    showPoints: boolean,
): number =>
    levelTree.filter(node => node.level === level && isOffMap(node, showPoints))
        .length;

type LevelOrgUnitRowsParams = {
    levelTree: PlanningLevelTreeNode[];
    level: number;
    assigneeByOrgUnitId: Map<number, Assignee>;
    teamIdByOrgUnitId: Map<number, number>;
    showPoints: boolean;
};

export const getLevelOrgUnitRows = ({
    levelTree,
    level,
    assigneeByOrgUnitId,
    teamIdByOrgUnitId,
    showPoints,
}: LevelOrgUnitRowsParams): OrgUnitRow[] => {
    const nameById = new Map(levelTree.map(node => [node.id, node.name]));
    const childIdsByParentId = new Map<number, number[]>();
    levelTree.forEach(node => {
        if (node.level !== level + 1 || node.parent_id === null) return;
        childIdsByParentId.set(node.parent_id, [
            ...(childIdsByParentId.get(node.parent_id) ?? []),
            node.id,
        ]);
    });
    return levelTree
        .filter(node => node.level === level)
        .map(node => {
            const teamId = teamIdByOrgUnitId.get(node.id);
            const childIds = childIdsByParentId.get(node.id) ?? [];
            return {
                ...node,
                parentName:
                    node.parent_id !== null
                        ? nameById.get(node.parent_id)
                        : undefined,
                assignee: assigneeByOrgUnitId.get(node.id),
                teamId,
                below:
                    teamId && childIds.length
                        ? {
                              assigned: childIds.filter(id =>
                                  assigneeByOrgUnitId.has(id),
                              ).length,
                              total: childIds.length,
                          }
                        : undefined,
                isOffMap: isOffMap(node, showPoints),
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
};

// Only assignments to a team: users can't be opened.
export const getTeamIdByOrgUnitId = (
    assignments: Assignment[],
): Map<number, number> =>
    new Map(
        assignments.flatMap(({ org_unit, team }) =>
            team ? [[org_unit, team]] : [],
        ),
    );
