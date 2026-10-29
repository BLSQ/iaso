import { TeamTreeNode } from 'Iaso/domains/teams/types/team';

export type TeamNavRowData = {
    kind: 'team';
    key: string;
    team: TeamTreeNode;
    depth: number;
    isScope: boolean;
    isExpanded: boolean;
    isExpandable: boolean;
};

export type TeamMemberRowData = {
    kind: 'member';
    key: string;
    depth: number;
    name: string;
    color: string;
    // Only sub-teams can be opened; users have none.
    team?: TeamTreeNode;
};

export type TeamsPanelRow = TeamNavRowData | TeamMemberRowData;
