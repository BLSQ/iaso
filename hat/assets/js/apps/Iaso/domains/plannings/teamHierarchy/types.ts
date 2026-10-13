import { Team, User } from 'Iaso/domains/teams/types/team';

export type HierarchyTeam = Pick<
    Team,
    'id' | 'name' | 'type' | 'parent' | 'color' | 'project' | 'users_details'
>;

export type TeamNode = {
    team: HierarchyTeam;
    children: TeamNode[];
};

export type TeamRowData = {
    kind: 'team';
    node: TeamNode;
    depth: number;
    isExpanded: boolean;
};

export type UserRowData = {
    kind: 'user';
    user: User;
    team: HierarchyTeam;
    depth: number;
};

export type HierarchyRow = TeamRowData | UserRowData;

export type DraggedItem =
    | { kind: 'team'; team: HierarchyTeam }
    | { kind: 'user'; user: User; team: HierarchyTeam };
