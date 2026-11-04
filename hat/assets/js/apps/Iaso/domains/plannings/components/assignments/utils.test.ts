import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { getTeamChain } from './utils';

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
