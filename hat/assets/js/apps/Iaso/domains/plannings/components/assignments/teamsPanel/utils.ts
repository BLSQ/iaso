import { teamKey } from 'Iaso/domains/teams/components/teamTree/utils';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { getTeamMembers } from '../utils';
import { TeamMemberRowData, TeamsPanelRow } from './types';

const getMemberRows = (
    team: TeamTreeNode,
    depth: number,
): TeamMemberRowData[] =>
    getTeamMembers(team).map(member => ({
        kind: 'member' as const,
        depth,
        ...member,
    }));

// The scope team lists its sub-teams and users as members; the other teams only show their sub-teams.
export const flattenTeamsPanelRows = (
    root: TeamTreeNode,
    scopeChain: TeamTreeNode[],
    expandedTeamIds: Set<number>,
): TeamsPanelRow[] => {
    const scopeTeamId = scopeChain.at(-1)?.id;
    const chainTeamIds = new Set(scopeChain.map(team => team.id));
    const rows: TeamsPanelRow[] = [];
    const visit = (team: TeamTreeNode, depth: number) => {
        const isScope = team.id === scopeTeamId;
        const isExpanded =
            chainTeamIds.has(team.id) || expandedTeamIds.has(team.id);
        rows.push({
            kind: 'team',
            key: teamKey(team.id),
            team,
            depth,
            isScope,
            isExpanded,
            isExpandable:
                team.children.length > 0 || (isScope && team.users.length > 0),
        });
        if (!isExpanded) return;
        if (isScope) {
            rows.push(...getMemberRows(team, depth + 1));
            return;
        }
        team.children.forEach(child => visit(child, depth + 1));
    };
    visit(root, 0);
    return rows;
};
