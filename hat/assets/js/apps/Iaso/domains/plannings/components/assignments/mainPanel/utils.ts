import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { collectTeamTreeNodes } from 'Iaso/domains/teams/utils';
import { getDisplayName } from 'Iaso/utils/usersUtils';
import {
    Assignee,
    Assignment,
    LevelOrgUnitNode,
    MapPresence,
    OrgUnitRow,
} from './types';

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
export const isOffMap = (node: MapPresence, showPoints: boolean): boolean =>
    !node.has_geo_json && !(showPoints && node.has_location);

export const countOrgUnitsOffMap = (
    nodes: MapPresence[],
    showPoints: boolean,
): number => nodes.filter(node => isOffMap(node, showPoints)).length;

// Planning levels are consecutive depths below the planning root, which is level 0.
export const getLevelTreeParams = (
    level: number,
    depthsCount: number,
): { level?: number; max_depth: number } => ({
    // Without a level, the API starts from the planning root.
    ...(level > 0 ? { level } : {}),
    // The API counts the planning root as depth 1.
    max_depth: level + depthsCount,
});

// The planning root is level 0: each level is one step deeper in the tree.
export const getOrgUnitsOfLevel = (
    roots: LevelOrgUnitNode[],
    level: number,
): LevelOrgUnitNode[] =>
    Array.from({ length: level }).reduce<LevelOrgUnitNode[]>(
        orgUnits => orgUnits.flatMap(orgUnit => orgUnit.children),
        roots,
    );

type LevelOrgUnitRowsParams = {
    parents: LevelOrgUnitNode[];
    assigneeByOrgUnitId: Map<number, Assignee>;
    teamIdByOrgUnitId: Map<number, number>;
    showPoints: boolean;
};

export const getLevelOrgUnitRows = ({
    parents,
    assigneeByOrgUnitId,
    teamIdByOrgUnitId,
    showPoints,
}: LevelOrgUnitRowsParams): OrgUnitRow[] =>
    parents
        .flatMap(parent =>
            parent.children.map(({ children, ...orgUnit }) => {
                const teamId = teamIdByOrgUnitId.get(orgUnit.id);
                return {
                    ...orgUnit,
                    parentName: parent.name,
                    assignee: assigneeByOrgUnitId.get(orgUnit.id),
                    teamId,
                    below:
                        teamId && children.length
                            ? {
                                  assigned: children.filter(child =>
                                      assigneeByOrgUnitId.has(child.id),
                                  ).length,
                                  total: children.length,
                              }
                            : undefined,
                    isOffMap: isOffMap(orgUnit, showPoints),
                };
            }),
        )
        .sort((a, b) => a.name.localeCompare(b.name));

// Only assignments to a team: users can't be opened.
export const getTeamIdByOrgUnitId = (
    assignments: Assignment[],
): Map<number, number> =>
    new Map(
        assignments.flatMap(({ org_unit, team }) =>
            team ? [[org_unit, team]] : [],
        ),
    );
