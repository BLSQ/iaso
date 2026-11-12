import { AssigneeRef, isAssignedTo } from '../api/utils';
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

// The root team's area is the target geography; sub-teams have an area once given org units.
export const getTeamIdsWithArea = (
    rootTeamId: number,
    assignments: Assignment[],
): Set<number> =>
    new Set([
        rootTeamId,
        ...assignments.flatMap(({ team }) => (team ? [team] : [])),
    ]);

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

// Limited to the assignable org units: a user can be a member of several teams.
export const getOrgUnitIdsAssignedTo = (
    assignments: Assignment[],
    assignee: AssigneeRef,
    assignableOrgUnitIds: Set<number>,
): number[] =>
    assignments
        .filter(
            assignment =>
                assignableOrgUnitIds.has(assignment.org_unit) &&
                isAssignedTo(assignment, assignee),
        )
        .map(assignment => assignment.org_unit);

export const getAssignedOrgUnitIds = (
    assignments: Assignment[],
    orgUnitIds: Set<number>,
): number[] =>
    assignments
        .filter(assignment => orgUnitIds.has(assignment.org_unit))
        .map(assignment => assignment.org_unit);

export const filterByName = <T extends { name: string }>(
    items: T[],
    search: string,
): T[] => {
    const query = search.trim().toLowerCase();
    return query
        ? items.filter(item => item.name.toLowerCase().includes(query))
        : items;
};

// Reassigning an org unit clears the assignments made inside it; assigning it to its current assignee changes nothing.
export const countClearedByReassign = (
    orgUnitIds: number[],
    assignments: Assignment[],
    assignee: AssigneeRef,
    orgUnitIdsWithAssignmentsBelow: Set<number>,
): number => {
    const assignmentByOrgUnitId = new Map(
        assignments.map(assignment => [assignment.org_unit, assignment]),
    );
    return orgUnitIds.filter(
        orgUnitId =>
            orgUnitIdsWithAssignmentsBelow.has(orgUnitId) &&
            !isAssignedTo(assignmentByOrgUnitId.get(orgUnitId), assignee),
    ).length;
};
