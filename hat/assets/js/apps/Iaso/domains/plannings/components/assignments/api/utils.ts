import { Assignment } from '../mainPanel/types';
import { TeamMember } from '../utils';

export type AssigneeRef = Pick<Assignment, 'team' | 'user'>;

export type AssignmentRequest =
    | { kind: 'create'; orgUnitId: number; assignee: AssigneeRef }
    | { kind: 'update'; assignmentId: number; assignee: AssigneeRef }
    | { kind: 'delete'; assignmentId: number };

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
export const getAssignmentRequests = (
    assignments: Assignment[],
    orgUnitIds: number[],
    assignee?: AssigneeRef,
): AssignmentRequest[] => {
    const assignmentByOrgUnitId = new Map(
        assignments.map(assignment => [assignment.org_unit, assignment]),
    );
    return orgUnitIds.flatMap((orgUnitId): AssignmentRequest[] => {
        const assignment = assignmentByOrgUnitId.get(orgUnitId);
        if (!assignee) {
            return assignment
                ? [{ kind: 'delete', assignmentId: assignment.id }]
                : [];
        }
        if (!assignment) return [{ kind: 'create', orgUnitId, assignee }];
        if (isAssignedTo(assignment, assignee)) return [];
        return [{ kind: 'update', assignmentId: assignment.id, assignee }];
    });
};

// Shown until the server answers: new assignments get a temporary negative id.
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
