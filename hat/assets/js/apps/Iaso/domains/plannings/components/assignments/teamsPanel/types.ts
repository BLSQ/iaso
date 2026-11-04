import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { TeamMember } from '../utils';

export type TeamNavRowData = {
    kind: 'team';
    key: string;
    team: TeamTreeNode;
    depth: number;
    isScope: boolean;
    isExpanded: boolean;
    isExpandable: boolean;
};

export type TeamMemberRowData = TeamMember & {
    kind: 'member';
    depth: number;
};

export type TeamsPanelRow = TeamNavRowData | TeamMemberRowData;
