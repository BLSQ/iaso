import { describe, expect, it } from 'vitest';
import { TeamType } from './constants';
import { TeamTreeNode, User } from './types/team';
import {
    collectTeamIds,
    collectTeamTreeNodes,
    countTeamsAndUsers,
    mapTeamTree,
    normalizeTeamTree,
} from './utils';

const makeUser = (id: number): User => ({
    id,
    username: `user${id}`,
    first_name: '',
    last_name: '',
    color: '',
    iaso_profile_id: id,
});

const makeTeam = (
    id: number,
    children: TeamTreeNode[] = [],
    users: User[] = [],
): TeamTreeNode => ({
    id,
    name: `Team ${id}`,
    type: users.length
        ? TeamType.enum.TEAM_OF_USERS
        : TeamType.enum.TEAM_OF_TEAMS,
    color: '',
    parent: null,
    depth: 0,
    users,
    children,
});

// 1 -> 2 -> 4 (users 10, 11)
//   -> 3 (users 11)
const TREE = makeTeam(1, [
    makeTeam(2, [makeTeam(4, [], [makeUser(10), makeUser(11)])]),
    makeTeam(3, [], [makeUser(11)]),
]);

describe('collectTeamIds', () => {
    it('lists the root and all its descendants, depth first', () => {
        expect(collectTeamIds(TREE)).toEqual([1, 2, 4, 3]);
    });
});

describe('mapTeamTree', () => {
    it('transforms every node and drops the ones mapped to undefined', () => {
        const tree = mapTeamTree(TREE, team =>
            team.id === 4 ? undefined : { ...team, name: `${team.name}!` },
        ) as TeamTreeNode;
        expect(tree.name).toBe('Team 1!');
        expect(tree.children.map(child => child.name)).toEqual([
            'Team 2!',
            'Team 3!',
        ]);
        expect(tree.children[0].children).toEqual([]);
    });

    it('reuses untouched nodes and only copies the changed path', () => {
        const tree = mapTeamTree(TREE, team =>
            team.id === 4 ? { ...team, name: 'Renamed' } : team,
        ) as TeamTreeNode;
        expect(tree).not.toBe(TREE);
        expect(tree.children[0]).not.toBe(TREE.children[0]);
        expect(tree.children[1]).toBe(TREE.children[1]);
    });

    it('returns the same tree when nothing changes', () => {
        expect(mapTeamTree(TREE, team => team)).toBe(TREE);
    });
});

describe('countTeamsAndUsers', () => {
    it('counts teams below the root and distinct users', () => {
        expect(countTeamsAndUsers(TREE)).toEqual({
            teamsCount: 3,
            usersCount: 2,
        });
    });
});

describe('normalizeTeamTree', () => {
    it('sorts sub-teams by name at every level', () => {
        const tree = normalizeTeamTree({
            ...makeTeam(1, [
                { ...makeTeam(5), name: 'Zeta' },
                {
                    ...makeTeam(9, [
                        { ...makeTeam(7), name: 'Yankee' },
                        { ...makeTeam(8), name: 'Bravo' },
                    ]),
                    name: 'Alpha',
                },
            ]),
        });
        expect(collectTeamIds(tree)).toEqual([1, 9, 8, 7, 5]);
    });

    it('derives depths from the root depth so moved subtrees are re-leveled', () => {
        const movedSubtree = makeTeam(2, [makeTeam(4)]);
        const tree = normalizeTeamTree({
            ...makeTeam(1, [makeTeam(3, [movedSubtree])]),
            depth: 2,
        });
        const depthById = Object.fromEntries(
            collectTeamTreeNodes(tree).map(({ id, depth }) => [id, depth]),
        );
        expect(depthById).toEqual({ 1: 2, 3: 3, 2: 4, 4: 5 });
    });

    it('returns the same tree when already sorted and leveled', () => {
        const tree = normalizeTeamTree(TREE);
        expect(normalizeTeamTree(tree)).toBe(tree);
    });
});
