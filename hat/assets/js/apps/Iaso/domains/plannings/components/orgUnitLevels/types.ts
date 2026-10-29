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

export type LevelTypeError =
    | 'requiredField'
    | 'mixedOrgUnitTypeDepths'
    | 'notDeeperThanLevelAbove';

export type SavedPlanningConfig = NonNullable<
    PaginatedPlanningConfigList['results']
>[number];
