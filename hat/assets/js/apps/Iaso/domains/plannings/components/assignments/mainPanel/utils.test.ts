import { TeamTreeNode, User } from 'Iaso/domains/teams/types/team';
import { AssignableOrgUnit, Assignment } from './types';
import { getAssigneeColorByOrgUnitId, toFeatureCollection } from './utils';

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

const square = {
    type: 'Polygon' as const,
    coordinates: [
        [
            [0, 0],
            [0, 1],
            [1, 1],
            [0, 0],
        ],
    ],
};

const makeOrgUnit = (id: number, withShape = true): AssignableOrgUnit => ({
    id,
    name: `Org unit ${id}`,
    latitude: null,
    longitude: null,
    org_unit_type_id: 1,
    geo_json: withShape
        ? {
              type: 'FeatureCollection',
              features: [{ type: 'Feature', geometry: square, properties: {} }],
          }
        : null,
});

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

describe('toFeatureCollection', () => {
    it('keeps one feature per shaped org unit with its id and name', () => {
        const { features } = toFeatureCollection([
            makeOrgUnit(1),
            makeOrgUnit(2, false),
        ]);
        expect(features).toHaveLength(1);
        expect(features[0].id).toBe(1);
        expect(features[0].properties).toEqual({ id: 1, name: 'Org unit 1' });
    });
});
