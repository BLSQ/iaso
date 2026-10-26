import { TeamTreeNode, User } from 'Iaso/domains/teams/types/team';
import { Assignment } from './types';
import { getAssigneeColorByOrgUnitId } from './utils';

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
