import { describe, expect, it } from 'vitest';
import { TeamType } from 'Iaso/domains/teams/constants';
import { User } from 'Iaso/domains/teams/types/team';
import { HierarchyTeam, TeamNode } from './types';
import {
    buildTeamTree,
    canDrop,
    countTeamsAndUsers,
    flattenTeamTree,
    getSearchMatches,
} from './utils';

const makeUser = (id: number, username: string): User => ({
    id,
    username,
    first_name: '',
    last_name: '',
    color: '',
    iaso_profile_id: id,
});

const makeTeam = (
    id: number,
    name: string,
    parent: number | undefined,
    type: TeamType | undefined,
    users: User[] = [],
): HierarchyTeam => ({
    id,
    name,
    parent,
    type,
    color: '',
    project: 1,
    users_details: users,
});

const alice = makeUser(100, 'alice');
const bob = makeUser(101, 'bob');

// root(1) -> alpha(2) -> alpha-users(4: alice, bob)
//         -> bravo(3)
const TEAMS = [
    makeTeam(3, 'Bravo', 1, TeamType.TEAM_OF_TEAMS),
    makeTeam(1, 'Root', undefined, TeamType.TEAM_OF_TEAMS),
    makeTeam(4, 'Alpha users', 2, TeamType.TEAM_OF_USERS, [alice, bob]),
    makeTeam(2, 'Alpha', 1, TeamType.TEAM_OF_TEAMS),
    makeTeam(99, 'Outside', undefined, TeamType.TEAM_OF_TEAMS),
];

const buildTree = (): TeamNode => buildTeamTree(TEAMS, 1) as TeamNode;
const teamById = (id: number) =>
    TEAMS.find(team => team.id === id) as HierarchyTeam;

describe('buildTeamTree', () => {
    it('builds the subtree below the root with children sorted by name', () => {
        const tree = buildTree();
        expect(tree.team.id).toBe(1);
        expect(tree.children.map(child => child.team.name)).toEqual([
            'Alpha',
            'Bravo',
        ]);
        expect(tree.children[0].children[0].team.id).toBe(4);
    });

    it('returns undefined when the root team is not in the list', () => {
        expect(buildTeamTree(TEAMS, 42)).toBeUndefined();
    });
});

describe('flattenTeamTree', () => {
    it('only lists children of expanded teams, users after sub-teams', () => {
        const rows = flattenTeamTree(buildTree(), new Set([1, 2, 4]));
        expect(
            rows.map(row =>
                row.kind === 'team' ? row.node.team.name : row.user.username,
            ),
        ).toEqual(['Root', 'Alpha', 'Alpha users', 'alice', 'bob', 'Bravo']);
        expect(rows.map(row => row.depth)).toEqual([0, 1, 2, 3, 3, 1]);
    });

    it('hides the subtree of a collapsed team', () => {
        const rows = flattenTeamTree(buildTree(), new Set([1]));
        expect(rows).toHaveLength(3);
    });
});

const searchRowLabels = (query: string) => {
    const tree = buildTree();
    return flattenTeamTree(tree, new Set(), getSearchMatches(tree, query)).map(
        row => (row.kind === 'team' ? row.node.team.name : row.user.username),
    );
};

describe('search', () => {
    it('shows the ancestors of a matching user but not its non-matching teammates', () => {
        expect(searchRowLabels('ali')).toEqual([
            'Root',
            'Alpha',
            'Alpha users',
            'alice',
        ]);
    });

    it('shows the whole subtree of a matching team, expanded', () => {
        expect(searchRowLabels('alpha')).toEqual([
            'Root',
            'Alpha',
            'Alpha users',
            'alice',
            'bob',
        ]);
    });

    it('shows nothing when nothing matches', () => {
        expect(searchRowLabels('zzz')).toEqual([]);
    });
});

describe('countTeamsAndUsers', () => {
    it('counts teams below the root and distinct users', () => {
        expect(countTeamsAndUsers(buildTree())).toEqual({
            teamsCount: 3,
            usersCount: 2,
        });
    });
});

describe('canDrop', () => {
    it('rejects dropping a team into its own subtree', () => {
        expect(
            canDrop(
                buildTree(),
                { kind: 'team', team: teamById(2) },
                teamById(4),
            ),
        ).toBe(false);
    });

    it('rejects dropping a team onto its current parent', () => {
        expect(
            canDrop(
                buildTree(),
                { kind: 'team', team: teamById(2) },
                teamById(1),
            ),
        ).toBe(false);
    });

    it('allows dropping a team onto a sibling team of teams', () => {
        expect(
            canDrop(
                buildTree(),
                { kind: 'team', team: teamById(2) },
                teamById(3),
            ),
        ).toBe(true);
    });

    it('rejects dropping a user onto a team of teams', () => {
        expect(
            canDrop(
                buildTree(),
                { kind: 'user', user: alice, team: teamById(4) },
                teamById(3),
            ),
        ).toBe(false);
    });

    it('allows dropping a user onto an empty team', () => {
        const emptyTeam = makeTeam(5, 'Empty', 3, undefined);
        expect(
            canDrop(
                buildTree(),
                { kind: 'user', user: alice, team: teamById(4) },
                emptyTeam,
            ),
        ).toBe(true);
    });
});
