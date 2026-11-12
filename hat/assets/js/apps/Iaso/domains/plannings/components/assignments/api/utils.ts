import { Assignment } from '../mainPanel/types';
import { TeamMember } from '../utils';

export type AssigneeRef = Pick<Assignment, 'team' | 'user'>;

export const getAssigneeRef = (member: TeamMember): AssigneeRef =>
    member.team
        ? { team: member.team.id, user: null }
        : { team: null, user: member.userId ?? null };

export const isAssignedTo = (
    assignment: Assignment | undefined,
    assignee: AssigneeRef,
): boolean =>
    assignment?.team === assignee.team && assignment?.user === assignee.user;

// Without an assignee, the org units are unassigned.
export const getChangedOrgUnitIds = (
    assignments: Assignment[],
    orgUnitIds: number[],
    assignee?: AssigneeRef,
): number[] => {
    const assignmentByOrgUnitId = new Map(
        assignments.map(assignment => [assignment.org_unit, assignment]),
    );
    return orgUnitIds.filter(orgUnitId => {
        const assignment = assignmentByOrgUnitId.get(orgUnitId);
        return assignee
            ? !isAssignedTo(assignment, assignee)
            : Boolean(assignment);
    });
};

// Shown until the server answers: new assignments get a temporary negative id.
// The assignments the server clears below reassigned org units disappear when it answers.
export const applyAssignmentChange = (
    assignments: Assignment[],
    orgUnitIds: number[],
    assignee?: AssigneeRef,
): Assignment[] => {
    const changedIds = new Set(orgUnitIds);
    const idByOrgUnitId = new Map(
        assignments.map(assignment => [assignment.org_unit, assignment.id]),
    );
    const unchanged = assignments.filter(
        assignment => !changedIds.has(assignment.org_unit),
    );
    if (!assignee) return unchanged;
    return [
        ...unchanged,
        ...orgUnitIds.map(orgUnitId => ({
            id: idByOrgUnitId.get(orgUnitId) ?? -orgUnitId,
            org_unit: orgUnitId,
            ...assignee,
        })),
    ];
};
