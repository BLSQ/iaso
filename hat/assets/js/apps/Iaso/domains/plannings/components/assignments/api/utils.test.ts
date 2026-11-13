import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { Assignment } from '../mainPanel/types';
import {
    applyAssignmentChange,
    getAssigneeRef,
    getChangedOrgUnitIds,
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

describe('getChangedOrgUnitIds', () => {
    it('keeps unassigned org units and org units assigned to someone else', () => {
        expect(
            getChangedOrgUnitIds(assignments, [100, 101, 102], teamA),
        ).toEqual([101, 102]);
    });

    it('keeps only assigned org units when unassigning', () => {
        expect(getChangedOrgUnitIds(assignments, [100, 102])).toEqual([100]);
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
