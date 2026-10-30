import { PaginatedPlanningConfigList } from 'Iaso/api/plannings';

export type LevelGroup = {
    id: number;
    name: string;
};

export type PlanningLevel = {
    orgUnitTypeIds: number[];
    groups: LevelGroup[];
};

export type LevelMembers = {
    teamsCount: number;
    usersCount: number;
};

export type LevelOrgUnitType = {
    id: number;
    name: string;
    depth: number;
};

export type LevelOrgUnitCounts = {
    total: number;
    // Org units of the level types, before filtering by groups.
    typesTotal: number;
    countByGroupId: Map<number, number>;
    countByTypeId: Map<number, number>;
};

export type LevelIssue =
    | { type: 'noOrgUnitOfType'; typeName: string }
    | { type: 'noOrgUnitInGroups' }
    | { type: 'excludedByGroups'; excludedCount: number; totalCount: number }
    | { type: 'emptyLevelAbove' };

export type LevelTypeError =
    | 'requiredField'
    | 'mixedOrgUnitTypeDepths'
    | 'notDeeperThanLevelAbove';

export type SavedPlanningConfig = NonNullable<
    PaginatedPlanningConfigList['results']
>[number];
