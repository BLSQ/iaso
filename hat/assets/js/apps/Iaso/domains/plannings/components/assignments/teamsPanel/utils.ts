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
        parentTeam: team,
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

// In assign mode every member can be picked: the teams of the chain and the picked team show their members.
export const flattenAssignPanelRows = (
    root: TeamTreeNode,
    scopeChain: TeamTreeNode[],
    assigneeTeamId?: number,
): TeamsPanelRow[] => {
    const expandedIds = new Set(scopeChain.map(team => team.id));
    if (assigneeTeamId !== undefined) expandedIds.add(assigneeTeamId);
    const rows: TeamsPanelRow[] = [
        {
            kind: 'team',
            key: teamKey(root.id),
            team: root,
            depth: 0,
            isScope: scopeChain.length === 1,
            isExpanded: true,
            isExpandable: false,
        },
    ];
    const visitMembers = (team: TeamTreeNode, depth: number) =>
        getMemberRows(team, depth).forEach(row => {
            rows.push(row);
            if (row.team && expandedIds.has(row.team.id)) {
                visitMembers(row.team, depth + 1);
            }
        });
    visitMembers(root, 1);
    return rows;
};
