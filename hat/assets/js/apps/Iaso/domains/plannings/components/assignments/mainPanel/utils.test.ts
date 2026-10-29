import { PlanningLevelTreeNode } from 'Iaso/api/plannings';
import { TeamTreeNode, User } from 'Iaso/domains/teams/types/team';
import { Assignment } from './types';
import {
    countOrgUnitsOffMap,
    getAssigneeColorByOrgUnitId,
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
