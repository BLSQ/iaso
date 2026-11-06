import { TeamTreeNode, User } from 'Iaso/domains/teams/types/team';
import { flattenTeamsPanelRows } from './utils';

const makeUser = (id: number): User => ({ id, username: `user${id}` }) as User;
const makeTeam = (
    id: number,
    children: TeamTreeNode[] = [],
    users: User[] = [],
): TeamTreeNode =>
    ({ id, name: `Team ${id}`, children, users }) as unknown as TeamTreeNode;

const usersTeam = makeTeam(3, [], [makeUser(10), makeUser(11)]);
const teamA = makeTeam(2, [usersTeam]);
const teamB = makeTeam(4, [makeTeam(5)]);
const root = makeTeam(1, [teamA, teamB]);

const describeRows = (rows: ReturnType<typeof flattenTeamsPanelRows>) =>
    rows.map(row => `${row.kind} ${row.key} @${row.depth}`);

describe('flattenTeamsPanelRows', () => {
    it('lists the sub-teams of the root as members when the root is the scope', () => {
        expect(
            describeRows(flattenTeamsPanelRows(root, [root], new Set())),
        ).toEqual(['team team-1 @0', 'member team-2 @1', 'member team-4 @1']);
    });

    it('expands the chain down to the scope and lists its users as members', () => {
        expect(
            describeRows(
                flattenTeamsPanelRows(
                    root,
                    [root, teamA, usersTeam],
                    new Set(),
                ),
            ),
        ).toEqual([
            'team team-1 @0',
            'team team-2 @1',
            'team team-3 @2',
            'member user-3-10 @3',
            'member user-3-11 @3',
            'team team-4 @1',
        ]);
    });

    it('shows the sub-teams of an expanded team outside the chain without their users', () => {
        expect(
            describeRows(
                flattenTeamsPanelRows(root, [root, teamB], new Set([2])),
            ),
        ).toEqual([
            'team team-1 @0',
            'team team-2 @1',
            'team team-3 @2',
            'team team-4 @1',
            'member team-5 @2',
        ]);
    });

    it('marks only the scope team and only teams with visible children as expandable', () => {
        const rows = flattenTeamsPanelRows(root, [root, teamA], new Set([2]));
        const teamRows = rows.filter(row => row.kind === 'team');
        expect(
            teamRows.map(row => [row.team.id, row.isScope, row.isExpandable]),
        ).toEqual([
            [1, false, true],
            [2, true, true],
            [4, false, true],
        ]);
    });
});
