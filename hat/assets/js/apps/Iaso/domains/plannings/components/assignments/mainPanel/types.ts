import { PlanningLevelTreeNode } from 'Iaso/api/plannings';

export type Assignment = {
    id: number;
    org_unit: number;
    team: number | null;
    user: number | null;
};

export type OrgUnitFeatureProperties = {
    id: number;
    name: string;
};

export type Assignee = {
    name: string;
    color: string;
};

export type OrgUnitRow = PlanningLevelTreeNode & {
    parentName?: string;
    assignee?: Assignee;
    // Set when assigned to a sub-team, which can be opened.
    teamId?: number;
    // How much of the level below the sub-team has assigned in turn.
    below?: { assigned: number; total: number };
    isOffMap: boolean;
};
