import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { getCurrentAssignee, getTeamChain, getTeamMembers } from './utils';

const makeNode = (id: number, children: TeamTreeNode[] = []): TeamTreeNode =>
    ({
        id,
        name: `Team ${id}`,
        children,
        users: [],
    }) as unknown as TeamTreeNode;

const tree = makeNode(1, [makeNode(2, [makeNode(3)]), makeNode(4)]);

describe('getTeamChain', () => {
    it('returns the teams from the root of the tree down to the given team', () => {
        expect(getTeamChain(tree, 3).map(team => team.id)).toEqual([1, 2, 3]);
    });

    it('returns only the root team when it is the given team', () => {
        expect(getTeamChain(tree, 1).map(team => team.id)).toEqual([1]);
    });

    it('returns an empty chain when the team is not in the tree', () => {
        expect(getTeamChain(tree, 42)).toEqual([]);
    });
});

describe('getCurrentAssignee', () => {
    const team = makeNode(1, [makeNode(2), makeNode(3)]);
    const members = getTeamMembers(team);

    it('returns the first member when no member was picked', () => {
        expect(getCurrentAssignee(members)?.name).toBe('Team 2');
    });

    it('returns the picked member', () => {
        expect(getCurrentAssignee(members, members[1].key)?.name).toBe(
            'Team 3',
        );
    });

    it('returns the first member when the picked member is not in the team', () => {
        expect(getCurrentAssignee(members, 'team-42')?.name).toBe('Team 2');
    });

    it('returns undefined when the team has no member', () => {
        expect(getCurrentAssignee([])).toBeUndefined();
    });
});
