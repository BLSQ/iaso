import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import {
    canHaveSubTeams,
    canHaveUsers,
    collectTeamIds,
    collectTeamTreeNodes,
} from 'Iaso/domains/teams/utils';
import { getDisplayName } from 'Iaso/utils/usersUtils';
import { DraggedItem, HierarchyRow } from './types';

export const teamKey = (teamId: number) => `team-${teamId}`;
export const userKey = (teamId: number, userId: number) =>
    `user-${teamId}-${userId}`;

// Matching teams stay visible with their whole subtree, and so do the ancestors of any match.
export const getSearchMatches = (
    root: TeamTreeNode,
    query: string,
): Set<string> => {
    const visibleKeys = new Set<string>();
    const lowerQuery = query.toLowerCase();
    const includesQuery = (text: string) =>
        text.toLowerCase().includes(lowerQuery);
    const showSubtree = (node: TeamTreeNode) =>
        collectTeamTreeNodes(node).forEach(team => {
            visibleKeys.add(teamKey(team.id));
            team.users.forEach(user =>
                visibleKeys.add(userKey(team.id, user.id)),
            );
        });
    const visit = (team: TeamTreeNode): boolean => {
        if (includesQuery(team.name)) {
            showSubtree(team);
            return true;
        }
        const matchingUsers = team.users.filter(user =>
            includesQuery(getDisplayName(user)),
        );
        matchingUsers.forEach(user =>
            visibleKeys.add(userKey(team.id, user.id)),
        );
        const childMatches = team.children.map(visit);
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
    root: TeamTreeNode,
    expandedTeamIds: Set<number>,
    visibleKeys?: Set<string>,
): HierarchyRow[] => {
    const rows: HierarchyRow[] = [];
    const isVisible = (key: string) => !visibleKeys || visibleKeys.has(key);
    const visit = (team: TeamTreeNode, depth: number) => {
        if (!isVisible(teamKey(team.id))) return;
        const isExpanded = Boolean(visibleKeys) || expandedTeamIds.has(team.id);
        rows.push({ kind: 'team', team, depth, isExpanded });
        if (!isExpanded) return;
        team.children.forEach(child => visit(child, depth + 1));
        team.users.forEach(user => {
            if (isVisible(userKey(team.id, user.id))) {
                rows.push({ kind: 'user', user, team, depth: depth + 1 });
            }
        });
    };
    visit(root, 0);
    return rows;
};

// A team can never be dropped into its own subtree.
export const getDropExcludedTeamIds = (item: DraggedItem): Set<number> =>
    new Set(item.kind === 'team' ? collectTeamIds(item.team) : []);

export const canDrop = (
    item: DraggedItem,
    target: TeamTreeNode,
    excludedTeamIds: Set<number>,
): boolean => {
    if (excludedTeamIds.has(target.id)) return false;
    if (item.kind === 'team') {
        return target.id !== item.team.parent && canHaveSubTeams(target);
    }
    const alreadyMember = target.users.some(user => user.id === item.user.id);
    return target.id !== item.team.id && !alreadyMember && canHaveUsers(target);
};

export type MoveTarget = { team: TeamTreeNode; path: string };

export const getMoveTargets = (
    root: TeamTreeNode,
    item: DraggedItem,
): MoveTarget[] => {
    const targets: MoveTarget[] = [];
    const excludedTeamIds = getDropExcludedTeamIds(item);
    const visit = (team: TeamTreeNode, ancestorNames: string[]) => {
        const names = [...ancestorNames, team.name];
        if (canDrop(item, team, excludedTeamIds)) {
            targets.push({ team, path: names.join(' / ') });
        }
        team.children.forEach(child => visit(child, names));
    };
    visit(root, []);
    return targets;
};
