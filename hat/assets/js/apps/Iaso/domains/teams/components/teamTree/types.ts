import { TeamTreeNode, User } from 'Iaso/domains/teams/types/team';

export type TeamRowData = {
    kind: 'team';
    team: TeamTreeNode;
    depth: number;
    isExpanded: boolean;
};

export type UserRowData = {
    kind: 'user';
    user: User;
    team: TeamTreeNode;
    depth: number;
};

export type HierarchyRow = TeamRowData | UserRowData;

export type DraggedItem =
    | { kind: 'team'; team: TeamTreeNode }
    | { kind: 'user'; user: User; team: TeamTreeNode };

type TeamActionKind = 'rename' | 'addSubTeam' | 'changeType' | 'delete';

// Mapped so each kind is its own union member and narrows in a switch.
export type HierarchyAction =
    | {
          [Kind in TeamActionKind]: { kind: Kind; team: TeamTreeNode };
      }[TeamActionKind]
    | { kind: 'move'; item: DraggedItem }
    | { kind: 'removeUser'; user: User; team: TeamTreeNode };

export type HierarchyDialog =
    | { kind: 'create'; parent: TeamTreeNode }
    | Extract<HierarchyAction, { kind: 'rename' | 'delete' | 'move' }>;
