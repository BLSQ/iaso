import { describe, expect, it } from 'vitest';
import { TeamType } from 'Iaso/domains/teams/constants';
import { User, TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { DraggedItem } from './types';
import {
    canDrop,
    flattenTeamTree,
    getDropExcludedTeamIds,
    getMoveTargets,
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
    parent: number | null,
    type: TeamType | undefined,
    {
        users = [],
        children = [],
    }: { users?: User[]; children?: TeamTreeNode[] } = {},
): TeamTreeNode => ({
    id,
    name,
    parent,
    type,
    color: '',
    depth: 0,
    users,
    children,
});

const alice = makeUser(100, 'alice');
const bob = makeUser(101, 'bob');

// root(1) -> alpha(2) -> alpha-users(4: alice, bob)
//         -> bravo(3)
const ALPHA_USERS = makeTeam(4, 'Alpha users', 2, TeamType.enum.TEAM_OF_USERS, {
    users: [alice, bob],
});
const ALPHA = makeTeam(2, 'Alpha', 1, TeamType.enum.TEAM_OF_TEAMS, {
    children: [ALPHA_USERS],
});
const BRAVO = makeTeam(3, 'Bravo', 1, TeamType.enum.TEAM_OF_TEAMS);
const ROOT = makeTeam(1, 'Root', null, TeamType.enum.TEAM_OF_TEAMS, {
    children: [ALPHA, BRAVO],
});

const canDropInTree = (item: DraggedItem, target: TeamTreeNode) =>
    canDrop(item, target, getDropExcludedTeamIds(item));
const rowLabel = (row: ReturnType<typeof flattenTeamTree>[number]) =>
    row.kind === 'team' ? row.team.name : row.user.username;

describe('flattenTeamTree', () => {
    it('only lists children of expanded teams, users after sub-teams', () => {
        const rows = flattenTeamTree(ROOT, new Set([1, 2, 4]));
        expect(rows.map(rowLabel)).toEqual([
            'Root',
            'Alpha',
            'Alpha users',
            'alice',
            'bob',
            'Bravo',
        ]);
        expect(rows.map(row => row.depth)).toEqual([0, 1, 2, 3, 3, 1]);
    });

    it('hides the subtree of a collapsed team', () => {
        const rows = flattenTeamTree(ROOT, new Set([1]));
        expect(rows).toHaveLength(3);
    });
});

const searchRowLabels = (query: string) =>
    flattenTeamTree(ROOT, new Set(), getSearchMatches(ROOT, query)).map(
        rowLabel,
    );

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

describe('canDrop', () => {
    it('rejects dropping a team into its own subtree', () => {
        expect(canDropInTree({ kind: 'team', team: ALPHA }, ALPHA_USERS)).toBe(
            false,
        );
    });

    it('rejects dropping a team onto its current parent', () => {
        expect(canDropInTree({ kind: 'team', team: ALPHA }, ROOT)).toBe(false);
    });

    it('allows dropping a team onto a sibling team of teams', () => {
        expect(canDropInTree({ kind: 'team', team: ALPHA }, BRAVO)).toBe(true);
    });

    it('rejects dropping a user onto a team of teams', () => {
        expect(
            canDropInTree(
                { kind: 'user', user: alice, team: ALPHA_USERS },
                BRAVO,
            ),
        ).toBe(false);
    });

    it('allows dropping a user onto an empty team', () => {
        const emptyTeam = makeTeam(5, 'Empty', 3, undefined);
        expect(
            canDropInTree(
                { kind: 'user', user: alice, team: ALPHA_USERS },
                emptyTeam,
            ),
        ).toBe(true);
    });
});

describe('getMoveTargets', () => {
    it('lists only valid destinations, labelled with their path', () => {
        const targets = getMoveTargets(ROOT, {
            kind: 'team',
            team: BRAVO,
        });
        expect(targets.map(({ path }) => path)).toEqual(['Root / Alpha']);
    });
});
