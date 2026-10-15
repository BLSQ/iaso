export type PlanningLevel = {
    orgUnitTypeIds: number[];
    groupIds: number[];
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
