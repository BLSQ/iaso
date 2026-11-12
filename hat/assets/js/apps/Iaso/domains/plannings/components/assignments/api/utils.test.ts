import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { Assignment } from '../mainPanel/types';
import {
    applyAssignmentChange,
    getAssigneeRef,
    getAssignmentRequests,
} from './utils';

const teamA = { team: 1, user: null };
const userB = { team: null, user: 2 };

const assignments: Assignment[] = [
    { id: 10, org_unit: 100, ...teamA },
    { id: 11, org_unit: 101, ...userB },
];

describe('getAssigneeRef', () => {
    it('refers to the team of a sub-team member', () => {
        const team = { id: 7 } as TeamTreeNode;
        expect(
            getAssigneeRef({ key: 't7', name: 'T', color: '', team }),
        ).toEqual({ team: 7, user: null });
    });

    it('refers to the user of a user member', () => {
        expect(
            getAssigneeRef({ key: 'u3', name: 'U', color: '', userId: 3 }),
        ).toEqual({ team: null, user: 3 });
    });
});

describe('getAssignmentRequests', () => {
    it('creates the assignment of an unassigned org unit', () => {
        expect(getAssignmentRequests(assignments, [102], teamA)).toEqual([
            { kind: 'create', orgUnitId: 102, assignee: teamA },
        ]);
    });

    it('updates the assignment of an org unit assigned to someone else', () => {
        expect(getAssignmentRequests(assignments, [101], teamA)).toEqual([
            { kind: 'update', assignmentId: 11, assignee: teamA },
        ]);
    });

    it('skips org units already assigned to the assignee', () => {
        expect(getAssignmentRequests(assignments, [100], teamA)).toEqual([]);
    });

    it('deletes the assignments of org units to unassign, skipping unassigned ones', () => {
        expect(getAssignmentRequests(assignments, [100, 102])).toEqual([
            { kind: 'delete', assignmentId: 10 },
        ]);
    });
});

describe('applyAssignmentChange', () => {
    it('assigns the org units, keeping existing ids and giving new ones a temporary id', () => {
        expect(applyAssignmentChange(assignments, [101, 102], teamA)).toEqual([
            { id: 10, org_unit: 100, ...teamA },
            { id: 11, org_unit: 101, ...teamA },
            { id: -102, org_unit: 102, ...teamA },
        ]);
    });

    it('removes the assignments of the org units to unassign', () => {
        expect(applyAssignmentChange(assignments, [100])).toEqual([
            { id: 11, org_unit: 101, ...userB },
        ]);
    });
});
