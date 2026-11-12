import { Assignment, LevelOrgUnitNode } from '../mainPanel/types';
import {
    countClearedByReassign,
    filterByName,
    getAssignableOrgUnitIds,
    getAssignedOrgUnitIds,
    getOrgUnitIdsAssignedTo,
    getOrgUnitIdsWithAssignmentsBelow,
    getTeamAreaOrgUnitIds,
    getTeamIdsWithArea,
} from './utils';

const makeNode = (
    id: number,
    children: LevelOrgUnitNode[] = [],
): LevelOrgUnitNode => ({ id, children }) as unknown as LevelOrgUnitNode;

const makeAssignment = (
    orgUnit: number,
    {
        team = null,
        user = null,
    }: { team?: number | null; user?: number | null },
): Assignment => ({ id: orgUnit, org_unit: orgUnit, team, user });

// Districts 1 and 2, their zones 11, 12 and 21, and the villages of zone 11.
const levelOrgUnits = [
    makeNode(1, [makeNode(11, [makeNode(111), makeNode(112)]), makeNode(12)]),
    makeNode(2, [makeNode(21)]),
];

describe('getTeamAreaOrgUnitIds', () => {
    const assignments = [
        makeAssignment(1, { team: 5 }),
        makeAssignment(2, { team: 6 }),
        makeAssignment(11, { user: 7 }),
    ];

    it('returns the org units assigned to the team', () => {
        expect(getTeamAreaOrgUnitIds(5, false, assignments)).toEqual(
            new Set([1]),
        );
    });

    it('returns an empty area for a sub-team that was given nothing', () => {
        expect(getTeamAreaOrgUnitIds(8, false, assignments)).toEqual(new Set());
    });

    it('returns no restriction for the root team', () => {
        expect(getTeamAreaOrgUnitIds(4, true, assignments)).toBeUndefined();
    });
});

describe('getAssignableOrgUnitIds', () => {
    it('returns the children of the org units of the area', () => {
        expect(getAssignableOrgUnitIds(levelOrgUnits, new Set([1]))).toEqual(
            new Set([11, 12]),
        );
    });

    it('returns nothing for an empty area', () => {
        expect(getAssignableOrgUnitIds(levelOrgUnits, new Set())).toEqual(
            new Set(),
        );
    });

    it('returns every child of the level without an area restriction', () => {
        expect(getAssignableOrgUnitIds(levelOrgUnits, undefined)).toEqual(
            new Set([11, 12, 21]),
        );
    });
});

describe('getOrgUnitIdsWithAssignmentsBelow', () => {
    it('returns the org units with an assigned child', () => {
        const assignments = [
            makeAssignment(11, { team: 5 }),
            makeAssignment(112, { user: 7 }),
            makeAssignment(21, { team: 6 }),
        ];
        expect(
            getOrgUnitIdsWithAssignmentsBelow(levelOrgUnits, assignments),
        ).toEqual(new Set([11]));
    });
});

describe('getTeamIdsWithArea', () => {
    it('returns the root team and the teams given org units', () => {
        const assignments = [
            makeAssignment(1, { team: 5 }),
            makeAssignment(11, { user: 7 }),
        ];
        expect(getTeamIdsWithArea(4, assignments)).toEqual(new Set([4, 5]));
    });
});

describe('getOrgUnitIdsAssignedTo', () => {
    it('returns the assignable org units assigned to the member, ignoring its other teams', () => {
        const assignments = [
            makeAssignment(11, { user: 7 }),
            makeAssignment(12, { team: 5 }),
            makeAssignment(21, { user: 7 }),
        ];
        expect(
            getOrgUnitIdsAssignedTo(
                assignments,
                { team: null, user: 7 },
                new Set([11, 12]),
            ),
        ).toEqual([11]);
    });
});

describe('getAssignedOrgUnitIds', () => {
    it('returns the given org units that are assigned', () => {
        const assignments = [
            makeAssignment(11, { user: 7 }),
            makeAssignment(21, { team: 5 }),
        ];
        expect(getAssignedOrgUnitIds(assignments, new Set([11, 12]))).toEqual([
            11,
        ]);
    });
});

describe('filterByName', () => {
    const items = [
        { name: 'Kinshasa' },
        { name: 'Kasai' },
        { name: 'Bas-Uele' },
    ];

    it('keeps the items whose name contains the search, ignoring case and spaces around', () => {
        expect(filterByName(items, ' KA ')).toEqual([{ name: 'Kasai' }]);
    });

    it('keeps every item without a search', () => {
        expect(filterByName(items, '')).toEqual(items);
    });
});

describe('countClearedByReassign', () => {
    it('counts the org units with assignments inside that change assignee', () => {
        const assignments = [
            makeAssignment(11, { team: 5 }),
            makeAssignment(12, { team: 6 }),
        ];
        expect(
            countClearedByReassign(
                [11, 12, 21],
                assignments,
                { team: 5, user: null },
                new Set([11, 12]),
            ),
        ).toBe(1);
    });
});
