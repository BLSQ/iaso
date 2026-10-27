import { TEAM_OF_TEAMS, TEAM_OF_USERS, TeamType } from './constants';
import { Team, TeamTreeNode } from './types/team';

type TeamWithType = Pick<Team, 'type'>;

export const canHaveSubTeams = ({ type }: TeamWithType): boolean =>
    type !== TEAM_OF_USERS;

export const canHaveUsers = ({ type }: TeamWithType): boolean =>
    type !== TEAM_OF_TEAMS;

export const getToggledType = ({ type }: TeamWithType): TeamType =>
    type === TEAM_OF_USERS ? TeamType.TEAM_OF_TEAMS : TeamType.TEAM_OF_USERS;

export const collectTeamTreeNodes = (root: TeamTreeNode): TeamTreeNode[] => {
    const nodes: TeamTreeNode[] = [];
    const visit = (node: TeamTreeNode) => {
        nodes.push(node);
        node.children.forEach(visit);
    };
    visit(root);
    return nodes;
};

export const collectTeamIds = (node: TeamTreeNode): number[] =>
    collectTeamTreeNodes(node).map(({ id }) => id);

const isSameList = <T>(a: T[], b: T[]): boolean =>
    a.length === b.length && a.every((item, index) => item === b[index]);

// Unchanged nodes are reused so memoized consumers only see the subtrees that actually changed.
const withChildren = (
    node: TeamTreeNode,
    children: TeamTreeNode[],
): TeamTreeNode =>
    isSameList(children, node.children) ? node : { ...node, children };

// Rebuilds the tree bottom-up; a node is dropped when transform returns undefined.
export const mapTeamTree = (
    node: TeamTreeNode,
    transform: (node: TeamTreeNode) => TeamTreeNode | undefined,
): TeamTreeNode | undefined =>
    transform(
        withChildren(
            node,
            node.children.flatMap(child => mapTeamTree(child, transform) ?? []),
        ),
    );

const byName = (a: TeamTreeNode, b: TeamTreeNode) =>
    a.name.localeCompare(b.name);

// Sorts sub-teams by name and derives each node's depth from its position under the root.
export const normalizeTeamTree = (
    node: TeamTreeNode,
    depth = node.depth,
): TeamTreeNode => {
    const normalized = withChildren(
        node,
        node.children
            .map(child => normalizeTeamTree(child, depth + 1))
            .sort(byName),
    );
    return normalized.depth === depth ? normalized : { ...normalized, depth };
};

export const countTeamsAndUsers = (root: TeamTreeNode) => {
    const nodes = collectTeamTreeNodes(root);
    const userIds = new Set(nodes.flatMap(({ users }) => users.map(u => u.id)));
    return { teamsCount: nodes.length - 1, usersCount: userIds.size };
};
