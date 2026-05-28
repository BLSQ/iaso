import { describe, expect, it } from 'vitest';
import {
    filterOrgUnits,
    getValidLocations,
    getValidShapes,
    isOrgunitVisible,
    isOuAssigned,
} from './utils';

const createOrgUnit = (overrides = {}) =>
    ({
        id: 1,
        name: 'OU',
        geo_json: null,
        has_geo_json: false,
        latitude: 10,
        longitude: 20,
        org_unit_type_id: 100,
        ...overrides,
    }) as any;

const createAssignment = (overrides = {}) =>
    ({
        id: 1,
        planning: 42,
        org_unit: 1,
        user: 0,
        team: 0,
        org_unit_details: {
            id: 1,
            name: 'OU',
            geo_json: null,
            latitude: null,
            longitude: null,
        },
        ...overrides,
    }) as any;

describe('assignments utils', () => {
    describe('getValidShapes', () => {
        it('returns only shape org units that match planning target types', () => {
            const planning = {
                target_org_unit_type_details: [{ id: 2, name: 'Area' }],
            } as any;
            const orgUnits = [
                createOrgUnit({ id: 1, has_geo_json: true, org_unit_type_id: 2 }),
                createOrgUnit({ id: 2, has_geo_json: false, org_unit_type_id: 2 }),
                createOrgUnit({ id: 3, has_geo_json: true, org_unit_type_id: 3 }),
            ];

            const result = getValidShapes(orgUnits, planning);

            expect(result).toEqual([orgUnits[0]]);
        });
    });

    describe('getValidLocations', () => {
        it('keeps only org units with valid coordinates', () => {
            const orgUnits = [
                createOrgUnit({ id: 1, latitude: 10, longitude: 20 }),
                createOrgUnit({ id: 2, latitude: null, longitude: 20 }),
                createOrgUnit({ id: 3, latitude: 91, longitude: 20 }),
            ];

            const result = getValidLocations(orgUnits);

            expect(result).toEqual([orgUnits[0]]);
        });

        it('returns empty array when org units are undefined', () => {
            expect(getValidLocations(undefined)).toEqual([]);
        });
    });

    describe('isOuAssigned', () => {
        it('is true when assignment has a user or a team', () => {
            const ou = createOrgUnit({ id: 7 });
            const assignments = {
                assignments: [],
                allAssignments: [createAssignment({ org_unit: 7, user: 12 })],
            };

            expect(isOuAssigned(ou, assignments as any)).toBe(true);
        });

        it('is false when assignment exists but user and team are empty', () => {
            const ou = createOrgUnit({ id: 7 });
            const assignments = {
                assignments: [],
                allAssignments: [createAssignment({ org_unit: 7, user: 0, team: 0 })],
            };

            expect(isOuAssigned(ou, assignments as any)).toBe(false);
        });
    });

    describe('isOrgunitVisible', () => {
        it('is true when org unit type is selected', () => {
            const ou = createOrgUnit({ org_unit_type_id: 2 });
            const selected = [{ value: 2, label: 'Area', original: {} }];

            expect(isOrgunitVisible(ou, selected as any)).toBe(true);
        });

        it('is false when no selected type matches', () => {
            const ou = createOrgUnit({ org_unit_type_id: 3 });
            const selected = [{ value: 2, label: 'Area', original: {} }];

            expect(isOrgunitVisible(ou, selected as any)).toBe(false);
        });
    });

    describe('filterOrgUnits', () => {
        it('splits org units into assigned and unassigned, filtered by selected type', () => {
            const visibleAssigned = createOrgUnit({ id: 1, org_unit_type_id: 2 });
            const visibleUnassigned = createOrgUnit({ id: 2, org_unit_type_id: 2 });
            const hiddenType = createOrgUnit({ id: 3, org_unit_type_id: 9 });
            const assignments = {
                assignments: [],
                allAssignments: [createAssignment({ org_unit: 1, team: 4 })],
            };
            const selected = [{ value: 2, label: 'Area', original: {} }];

            const result = filterOrgUnits(
                [visibleAssigned, visibleUnassigned, hiddenType],
                assignments as any,
                selected as any,
            );

            expect(result.assigned).toEqual([visibleAssigned]);
            expect(result.unassigned).toEqual([visibleUnassigned]);
        });
    });
});
