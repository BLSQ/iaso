import { describe, expect, it } from 'vitest';
import { TeamType } from 'Iaso/domains/teams/constants';
import { TeamTreeNode, User } from 'Iaso/domains/teams/types/team';
import { LevelOrgUnitType, PlanningLevel, SavedPlanningConfig } from './types';
import {
    configsToLevels,
    getLevelMembers,
    getPlanningConfigChanges,
    getLevelTypeOptions,
    validateLevelTypes,
} from './utils';

const makeUser = (id: number): User => ({
    id,
    username: `user${id}`,
    first_name: '',
    last_name: '',
    color: '',
    iaso_profile_id: id,
});

const makeNode = (
    id: number,
    children: TeamTreeNode[] = [],
    users: User[] = [],
): TeamTreeNode => ({
    id,
    name: `Team ${id}`,
    type: users.length ? TeamType.TEAM_OF_USERS : TeamType.TEAM_OF_TEAMS,
    color: '',
    parent: null,
    depth: 0,
    users,
    children,
});

// Below a province: zones, then areas and hospitals, then centres.
const TYPES: LevelOrgUnitType[] = [
    { id: 2, name: 'Zone', depth: 1 },
    { id: 3, name: 'Area', depth: 2 },
    { id: 5, name: 'Hospital', depth: 2 },
    { id: 4, name: 'Centre', depth: 3 },
];

const level = (
    orgUnitTypeIds: number[],
    groupIds: number[] = [],
): PlanningLevel => ({
    orgUnitTypeIds,
    groupIds,
});
const optionNames = (levels: PlanningLevel[], index: number) =>
    getLevelTypeOptions(levels, index, TYPES).map(type => type.name);

describe('getLevelMembers', () => {
    it('counts teams per depth and puts users one level below their team', () => {
        const root = makeNode(1, [
            makeNode(2, [makeNode(4, [], [makeUser(10), makeUser(11)])]),
            makeNode(3, [makeNode(5, [], [makeUser(11), makeUser(12)])]),
        ]);
        expect(getLevelMembers(root)).toEqual([
            { teamsCount: 2, usersCount: 0 },
            { teamsCount: 2, usersCount: 0 },
            { teamsCount: 0, usersCount: 3 },
        ]);
    });

    it('returns no level for a root team without members', () => {
        expect(getLevelMembers(makeNode(1))).toEqual([]);
    });
});

describe('getLevelTypeOptions', () => {
    it('only offers types deeper than the level above', () => {
        expect(optionNames([level([2]), level([])], 1)).toEqual([
            'Area',
            'Hospital',
            'Centre',
        ]);
    });

    it('only offers types shallower than the level below', () => {
        expect(optionNames([level([]), level([4])], 0)).toEqual([
            'Zone',
            'Area',
            'Hospital',
        ]);
    });

    it('restricts to the depth of the types already selected on the level', () => {
        expect(optionNames([level([2]), level([3])], 1)).toEqual([
            'Area',
            'Hospital',
        ]);
    });
});

describe('validateLevelTypes', () => {
    it('accepts strictly deeper levels, with several types at the same depth', () => {
        expect(
            validateLevelTypes(
                [level([2]), level([3, 5]), level([4])],
                3,
                TYPES,
            ),
        ).toEqual([undefined, undefined, undefined]);
    });

    it('requires a type on every level, including levels not yet in the form', () => {
        expect(validateLevelTypes([level([2])], 2, TYPES)).toEqual([
            undefined,
            'requiredField',
        ]);
    });

    it('rejects types of different depths on the same level', () => {
        expect(validateLevelTypes([level([2, 3])], 1, TYPES)).toEqual([
            'mixedOrgUnitTypeDepths',
        ]);
    });

    it('rejects a level that is not deeper than the level above', () => {
        expect(validateLevelTypes([level([3]), level([5])], 2, TYPES)).toEqual([
            undefined,
            'notDeeperThanLevelAbove',
        ]);
    });
});

const makeConfig = (
    id: number,
    levelNumber: number,
    typeIds: number[],
    groupIds: number[] = [],
): SavedPlanningConfig => ({
    id,
    level: levelNumber,
    org_unit_types: typeIds.map(typeId => ({ id: typeId, name: '' })),
    org_unit_groups: groupIds.map(groupId => ({ id: groupId, name: '' })),
});

describe('configsToLevels', () => {
    it('maps configs to levels by level number, filling gaps with empty levels', () => {
        expect(
            configsToLevels([
                makeConfig(10, 1, [2], [7]),
                makeConfig(11, 3, [4]),
            ]),
        ).toEqual([
            { orgUnitTypeIds: [2], groupIds: [7] },
            { orgUnitTypeIds: [], groupIds: [] },
            { orgUnitTypeIds: [4], groupIds: [] },
        ]);
    });

    it('treats null types and groups as empty', () => {
        expect(
            configsToLevels([
                {
                    id: 1,
                    level: 1,
                    org_unit_types: null,
                    org_unit_groups: null,
                },
            ]),
        ).toEqual([{ orgUnitTypeIds: [], groupIds: [] }]);
    });
});

describe('getPlanningConfigChanges', () => {
    it('creates every level when nothing is saved yet', () => {
        expect(
            getPlanningConfigChanges(5, [level([2], [7]), level([3])], []),
        ).toEqual({
            toCreate: [
                {
                    planning: 5,
                    level: 1,
                    org_unit_types: [2],
                    org_unit_groups: [7],
                },
                {
                    planning: 5,
                    level: 2,
                    org_unit_types: [3],
                    org_unit_groups: [],
                },
            ],
            toUpdate: [],
            toDeleteIds: [],
        });
    });

    it('updates only changed levels, ignoring the order of ids', () => {
        const saved = [makeConfig(10, 1, [2, 5]), makeConfig(11, 2, [3])];
        expect(
            getPlanningConfigChanges(5, [level([5, 2]), level([4])], saved),
        ).toEqual({
            toCreate: [],
            toUpdate: [
                {
                    id: 11,
                    level: 2,
                    org_unit_types: [4],
                    org_unit_groups: [],
                },
            ],
            toDeleteIds: [],
        });
    });

    it('deletes saved configs deeper than the form levels', () => {
        const saved = [makeConfig(10, 1, [2]), makeConfig(11, 2, [3])];
        expect(getPlanningConfigChanges(5, [level([2])], saved)).toEqual({
            toCreate: [],
            toUpdate: [],
            toDeleteIds: [11],
        });
    });
});
