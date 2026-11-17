import { OrgUnitTree } from 'Iaso/api/plannings';

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

// The OpenAPI schema can't express the recursion: it types grandchildren as unknown.
export type LevelOrgUnitNode = Omit<OrgUnitTree, 'children'> & {
    children: LevelOrgUnitNode[];
};

export type MapPresence = Pick<OrgUnitTree, 'has_geo_json' | 'has_location'>;

export type OrgUnitRow = Omit<LevelOrgUnitNode, 'children'> & {
    parentName: string;
    assignee?: Assignee;
    // Set when assigned to a sub-team, which can be opened.
    teamId?: number;
    // How much of the level below the sub-team has assigned in turn.
    below?: { assigned: number; total: number };
    isOffMap: boolean;
};
