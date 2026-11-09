import { TeamTreeNode, User } from 'Iaso/domains/teams/types/team';
import { Assignment, LevelOrgUnitNode } from './types';
import {
    countOrgUnitsOffMap,
    getAssigneeByOrgUnitId,
    getAssigneeColorByOrgUnitId,
    getLevelOrgUnitRows,
    getLevelTreeParams,
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
    const nodes = [
        { has_geo_json: true, has_location: false },
        { has_geo_json: false, has_location: true },
        { has_geo_json: false, has_location: false },
    ];

    it('counts the org units with neither a shape nor a drawn point', () => {
        expect(countOrgUnitsOffMap(nodes, true)).toBe(1);
    });

    it('counts org units with only a location when points are not drawn', () => {
        expect(countOrgUnitsOffMap(nodes, false)).toBe(2);
    });
});

describe('getLevelTreeParams', () => {
    it('starts from the planning root without a level for level 0', () => {
        expect(getLevelTreeParams(0, 2)).toEqual({ max_depth: 2 });
    });

    it('starts from the level and stops after the requested number of depths', () => {
        expect(getLevelTreeParams(2, 3)).toEqual({ level: 2, max_depth: 5 });
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
        children: LevelOrgUnitNode[] = [],
        hasShape = true,
    ) =>
        ({
            id,
            name,
            children,
            has_geo_json: hasShape,
            has_location: false,
        }) as unknown as LevelOrgUnitNode;
    const parents = [
        makeNode(1, 'Province', [
            makeNode(2, 'Zone B', [
                makeNode(4, 'Area 1'),
                makeNode(5, 'Area 2'),
            ]),
            makeNode(3, 'Zone A', [], false),
        ]),
    ];
    const team = { name: 'Team 2', color: '#alpha' };
    const user = { name: 'jdoe', color: '#user' };

    it('lists the org units of the level sorted by name, with their parent, assignee and map presence', () => {
        const rows = getLevelOrgUnitRows({
            parents,
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
            parents,
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
            parents,
            assigneeByOrgUnitId: new Map([[2, user]]),
            teamIdByOrgUnitId: new Map(),
            showPoints: false,
        }).filter(({ id }) => id === 2);
        expect(row.teamId).toBeUndefined();
        expect(row.below).toBeUndefined();
    });
});
