import { Assignment, LevelOrgUnitNode } from '../mainPanel/types';

// Undefined for the root team: its area is the whole target geography.
export const getTeamAreaOrgUnitIds = (
    teamId: number,
    isRootTeam: boolean,
    assignments: Assignment[],
): Set<number> | undefined =>
    isRootTeam
        ? undefined
        : new Set(
              assignments
                  .filter(assignment => assignment.team === teamId)
                  .map(assignment => assignment.org_unit),
          );

// A team's members can only be given the children of the org units the team was given.
export const getAssignableOrgUnitIds = (
    levelOrgUnits: LevelOrgUnitNode[],
    areaOrgUnitIds: Set<number> | undefined,
): Set<number> =>
    new Set(
        levelOrgUnits
            .filter(
                orgUnit => !areaOrgUnitIds || areaOrgUnitIds.has(orgUnit.id),
            )
            .flatMap(orgUnit => orgUnit.children.map(child => child.id)),
    );

// Org units whose assignee split them further: changing their assignee clears that work.
export const getOrgUnitIdsWithAssignmentsBelow = (
    levelOrgUnits: LevelOrgUnitNode[],
    assignments: Assignment[],
): Set<number> => {
    const assignedOrgUnitIds = new Set(
        assignments.map(assignment => assignment.org_unit),
    );
    return new Set(
        levelOrgUnits
            .flatMap(orgUnit => orgUnit.children)
            .filter(member =>
                member.children.some(child => assignedOrgUnitIds.has(child.id)),
            )
            .map(member => member.id),
    );
};
