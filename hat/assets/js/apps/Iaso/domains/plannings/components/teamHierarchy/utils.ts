import { groupBy } from 'lodash';
import { canHaveSubTeams, canHaveUsers } from 'Iaso/domains/teams/utils';
import { getDisplayName } from 'Iaso/utils/usersUtils';
import { DraggedItem, HierarchyRow, HierarchyTeam, TeamNode } from './types';

export const teamKey = (teamId: number) => `team-${teamId}`;
export const userKey = (teamId: number, userId: number) =>
    `user-${teamId}-${userId}`;

const byName = (a: TeamNode, b: TeamNode) =>
    a.team.name.localeCompare(b.team.name);

export const buildTeamTree = (
    teams: HierarchyTeam[],
    rootTeamId: number,
): TeamNode | undefined => {
    const childrenByParent = groupBy(teams, 'parent');
    const buildNode = (team: HierarchyTeam): TeamNode => ({
        team,
        children: (childrenByParent[team.id] ?? []).map(buildNode).sort(byName),
    });
    const root = teams.find(team => team.id === rootTeamId);
    return root && buildNode(root);
};

const collectNodes = (node: TeamNode): TeamNode[] => [
    node,
    ...node.children.flatMap(collectNodes),
];

export const collectTeamIds = (node: TeamNode): number[] =>
    collectNodes(node).map(({ team }) => team.id);

const findNode = (root: TeamNode, teamId: number): TeamNode | undefined =>
    collectNodes(root).find(({ team }) => team.id === teamId);

// Matching teams stay visible with their whole subtree, and so do the ancestors of any match.
export const getSearchMatches = (
    root: TeamNode,
    query: string,
): Set<string> => {
    const visibleKeys = new Set<string>();
    const lowerQuery = query.toLowerCase();
    const includesQuery = (text: string) =>
        text.toLowerCase().includes(lowerQuery);
    const showSubtree = (node: TeamNode) =>
        collectNodes(node).forEach(({ team }) => {
            visibleKeys.add(teamKey(team.id));
            team.users_details?.forEach(user =>
                visibleKeys.add(userKey(team.id, user.id)),
            );
        });
    const visit = (node: TeamNode): boolean => {
        const { team } = node;
        if (includesQuery(team.name)) {
            showSubtree(node);
            return true;
        }
        const matchingUsers = (team.users_details ?? []).filter(user =>
            includesQuery(getDisplayName(user)),
        );
        matchingUsers.forEach(user =>
            visibleKeys.add(userKey(team.id, user.id)),
        );
        const childMatches = node.children.map(visit);
        const hasMatch =
            childMatches.includes(true) || matchingUsers.length > 0;
        if (hasMatch) visibleKeys.add(teamKey(team.id));
        return hasMatch;
    };
    visit(root);
    return visibleKeys;
};

// With visibleKeys (search results), every visible team is shown expanded.
export const flattenTeamTree = (
    root: TeamNode,
    expandedTeamIds: Set<number>,
    visibleKeys?: Set<string>,
): HierarchyRow[] => {
    const rows: HierarchyRow[] = [];
    const isVisible = (key: string) => !visibleKeys || visibleKeys.has(key);
    const visit = (node: TeamNode, depth: number) => {
        const { team } = node;
        if (!isVisible(teamKey(team.id))) return;
        const isExpanded = Boolean(visibleKeys) || expandedTeamIds.has(team.id);
        rows.push({ kind: 'team', node, depth, isExpanded });
        if (!isExpanded) return;
        node.children.forEach(child => visit(child, depth + 1));
        team.users_details?.forEach(user => {
            if (isVisible(userKey(team.id, user.id))) {
                rows.push({ kind: 'user', user, team, depth: depth + 1 });
            }
        });
    };
    visit(root, 0);
    return rows;
};

export const countTeamsAndUsers = (root: TeamNode) => {
    const nodes = collectNodes(root);
    const userIds = new Set(
        nodes.flatMap(({ team }) => (team.users_details ?? []).map(u => u.id)),
    );
    return { teamsCount: nodes.length - 1, usersCount: userIds.size };
};

// A team can never be dropped into its own subtree.
export const getDropExcludedTeamIds = (
    root: TeamNode,
    item: DraggedItem,
): Set<number> => {
    const draggedNode =
        item.kind === 'team' ? findNode(root, item.team.id) : undefined;
    return new Set(draggedNode ? collectTeamIds(draggedNode) : []);
};

export const canDrop = (
    item: DraggedItem,
    target: HierarchyTeam,
    excludedTeamIds: Set<number>,
): boolean => {
    if (excludedTeamIds.has(target.id)) return false;
    if (item.kind === 'team') {
        return target.id !== item.team.parent && canHaveSubTeams(target);
    }
    const alreadyMember = (target.users_details ?? []).some(
        user => user.id === item.user.id,
    );
    return target.id !== item.team.id && !alreadyMember && canHaveUsers(target);
};

export type MoveTarget = { team: HierarchyTeam; path: string };

export const getMoveTargets = (
    root: TeamNode,
    item: DraggedItem,
): MoveTarget[] => {
    const targets: MoveTarget[] = [];
    const excludedTeamIds = getDropExcludedTeamIds(root, item);
    const visit = (node: TeamNode, ancestorNames: string[]) => {
        const names = [...ancestorNames, node.team.name];
        if (canDrop(item, node.team, excludedTeamIds)) {
            targets.push({ team: node.team, path: names.join(' / ') });
        }
        node.children.forEach(child => visit(child, names));
    };
    visit(root, []);
    return targets;
};
