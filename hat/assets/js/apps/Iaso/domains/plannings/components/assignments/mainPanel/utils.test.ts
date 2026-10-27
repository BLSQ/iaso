import { PlanningLevelTreeNode } from 'Iaso/api/plannings';
import { TeamTreeNode, User } from 'Iaso/domains/teams/types/team';
import { Assignment } from './types';
import {
    countOrgUnitsOffMap,
    getAssigneeByOrgUnitId,
    getAssigneeColorByOrgUnitId,
    getLevelOrgUnitRows,
    getTeamIdByOrgUnitId,
} from './utils';

const makeTeam = (
    id: number,
    color: string,
    children: TeamTreeNode[] = [],
    users: User[] = [],
): TeamTreeNode =>
    ({
        id,
        name: `Team ${id}`,
        color,
        children,
        users,
    }) as unknown as TeamTreeNode;

const makeAssignment = (
    orgUnit: number,
    {
        team = null,
        user = null,
    }: { team?: number | null; user?: number | null },
): Assignment => ({ id: orgUnit, org_unit: orgUnit, team, user });

describe('getAssigneeColorByOrgUnitId', () => {
    const user = { id: 7, color: '#user' } as User;
    const tree = makeTeam(1, '#root', [
        makeTeam(2, '#alpha'),
        makeTeam(3, '#bravo', [], [user]),
    ]);

    it('maps org units assigned to a team to the team color and to a user to the user color', () => {
        const colors = getAssigneeColorByOrgUnitId(tree, [
            makeAssignment(10, { team: 2 }),
            makeAssignment(11, { user: 7 }),
        ]);
        expect(colors.get(10)).toBe('#alpha');
        expect(colors.get(11)).toBe('#user');
    });

    it('leaves org units assigned outside the team tree without a color', () => {
        const colors = getAssigneeColorByOrgUnitId(tree, [
            makeAssignment(12, { team: 99 }),
        ]);
        expect(colors.has(12)).toBe(false);
    });
});

describe('countOrgUnitsOffMap', () => {
    const makeNode = (
        id: number,
        level: number,
        hasShape: boolean,
        hasLocation: boolean,
    ): PlanningLevelTreeNode =>
        ({
            id,
            level,
            has_geo_json: hasShape,
            has_location: hasLocation,
        }) as PlanningLevelTreeNode;
    const levelTree = [
        makeNode(1, 1, true, false),
        makeNode(2, 1, false, true),
        makeNode(3, 1, false, false),
        makeNode(4, 2, false, false),
    ];

    it('counts the org units of the level with neither a shape nor a drawn point', () => {
        expect(countOrgUnitsOffMap(levelTree, 1, true)).toBe(1);
    });

    it('counts org units with only a location when points are not drawn', () => {
        expect(countOrgUnitsOffMap(levelTree, 1, false)).toBe(2);
    });
});

describe('getTeamIdByOrgUnitId', () => {
    it('maps org units assigned to a team to the team, and skips those assigned to a user', () => {
        const teamIds = getTeamIdByOrgUnitId([
            makeAssignment(10, { team: 2 }),
            makeAssignment(11, { user: 7 }),
        ]);
        expect(teamIds.get(10)).toBe(2);
        expect(teamIds.has(11)).toBe(false);
    });
});

describe('getAssigneeByOrgUnitId', () => {
    it('names org units assigned to a team after the team and to a user after the user', () => {
        const user = { id: 7, username: 'jdoe', color: '#user' } as User;
        const tree = makeTeam(1, '#root', [makeTeam(2, '#alpha', [], [user])]);
        const assignees = getAssigneeByOrgUnitId(tree, [
            makeAssignment(10, { team: 2 }),
            makeAssignment(11, { user: 7 }),
            makeAssignment(12, { team: 99 }),
        ]);
        expect(assignees.get(10)).toEqual({ name: 'Team 2', color: '#alpha' });
        expect(assignees.get(11)).toEqual({ name: 'jdoe', color: '#user' });
        expect(assignees.has(12)).toBe(false);
    });
});

describe('getLevelOrgUnitRows', () => {
    const makeNode = (
        id: number,
        name: string,
        level: number,
        parentId: number | null = null,
        hasShape = true,
    ) =>
        ({
            id,
            name,
            level,
            parent_id: parentId,
            has_geo_json: hasShape,
            has_location: false,
        }) as PlanningLevelTreeNode;
    const levelTree = [
        makeNode(1, 'Province', 0),
        makeNode(2, 'Zone B', 1, 1),
        makeNode(3, 'Zone A', 1, 1, false),
        makeNode(4, 'Area 1', 2, 2),
        makeNode(5, 'Area 2', 2, 2),
    ];
    const team = { name: 'Team 2', color: '#alpha' };
    const user = { name: 'jdoe', color: '#user' };

    it('lists the org units of the level sorted by name, with their parent, assignee and map presence', () => {
        const rows = getLevelOrgUnitRows({
            levelTree,
            level: 1,
            assigneeByOrgUnitId: new Map([[2, team]]),
            teamIdByOrgUnitId: new Map(),
            showPoints: false,
        });
        expect(
            rows.map(({ id, parentName, assignee, isOffMap }) => ({
                id,
                parentName,
                assignee,
                isOffMap,
            })),
        ).toEqual([
            {
                id: 3,
                parentName: 'Province',
                assignee: undefined,
                isOffMap: true,
            },
            { id: 2, parentName: 'Province', assignee: team, isOffMap: false },
        ]);
    });

    it('counts the assigned org units below an org unit assigned to a sub-team', () => {
        const [row] = getLevelOrgUnitRows({
            levelTree,
            level: 1,
            assigneeByOrgUnitId: new Map([
                [2, team],
                [4, user],
            ]),
            teamIdByOrgUnitId: new Map([[2, 20]]),
            showPoints: false,
        }).filter(({ id }) => id === 2);
        expect(row.teamId).toBe(20);
        expect(row.below).toEqual({ assigned: 1, total: 2 });
    });

    it('has nothing below an org unit that is not assigned to a sub-team', () => {
        const [row] = getLevelOrgUnitRows({
            levelTree,
            level: 1,
            assigneeByOrgUnitId: new Map([[2, user]]),
            teamIdByOrgUnitId: new Map(),
            showPoints: false,
        }).filter(({ id }) => id === 2);
        expect(row.teamId).toBeUndefined();
        expect(row.below).toBeUndefined();
    });
});
