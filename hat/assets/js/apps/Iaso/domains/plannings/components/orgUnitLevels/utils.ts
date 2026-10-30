import { uniq, xor } from 'lodash';
import {
    PlanningConfigBulkCreateRequest,
    PlanningConfigBulkUpdateRequest,
} from 'Iaso/api/planningConfigs';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import {
    LevelIssue,
    LevelMembers,
    LevelOrgUnitCounts,
    LevelOrgUnitType,
    LevelTypeError,
    PlanningLevel,
    SavedPlanningConfig,
} from './types';

export const EMPTY_LEVEL: PlanningLevel = { orgUnitTypeIds: [], groups: [] };

// Level N holds the teams at depth N of the hierarchy, and the users of the teams at depth N - 1.
export const getLevelMembers = (root: TeamTreeNode): LevelMembers[] => {
    const teamsCounts: number[] = [];
    const userIdsByLevel: Set<number>[] = [];
    const visit = ({ users, children }: TeamTreeNode, depth: number) => {
        if (depth > 0) {
            teamsCounts[depth - 1] = (teamsCounts[depth - 1] ?? 0) + 1;
        }
        if (users.length) {
            const userIds = userIdsByLevel[depth] ?? new Set<number>();
            users.forEach(user => userIds.add(user.id));
            userIdsByLevel[depth] = userIds;
        }
        children.forEach(child => visit(child, depth + 1));
    };
    visit(root, 0);
    const levelsCount = Math.max(teamsCounts.length, userIdsByLevel.length);
    return Array.from({ length: levelsCount }, (_, index) => ({
        teamsCount: teamsCounts[index] ?? 0,
        usersCount: userIdsByLevel[index]?.size ?? 0,
    }));
};

const getDepths = (
    level: PlanningLevel | undefined,
    depthByTypeId: Map<number, number>,
): number[] =>
    uniq(
        (level?.orgUnitTypeIds ?? [])
            .map(typeId => depthByTypeId.get(typeId))
            .filter((depth): depth is number => depth !== undefined),
    );

export const getLevelTypeOptions = (
    levels: PlanningLevel[],
    levelIndex: number,
    types: LevelOrgUnitType[],
): LevelOrgUnitType[] => {
    const depthByTypeId = new Map(types.map(type => [type.id, type.depth]));
    const depthsAbove = levels
        .slice(0, levelIndex)
        .flatMap(level => getDepths(level, depthByTypeId));
    const depthsBelow = levels
        .slice(levelIndex + 1)
        .flatMap(level => getDepths(level, depthByTypeId));
    const minDepth = Math.max(0, ...depthsAbove);
    const maxDepth = Math.min(Infinity, ...depthsBelow);
    const [currentDepth] = getDepths(levels[levelIndex], depthByTypeId);
    const selectedIds = levels[levelIndex]?.orgUnitTypeIds ?? [];
    return types.filter(
        type =>
            selectedIds.includes(type.id) ||
            (type.depth > minDepth &&
                type.depth < maxDepth &&
                (currentDepth === undefined || type.depth === currentDepth)),
    );
};

export const validateLevelTypes = (
    levels: PlanningLevel[],
    levelsCount: number,
    types: LevelOrgUnitType[],
): (LevelTypeError | undefined)[] => {
    const depthByTypeId = new Map(types.map(type => [type.id, type.depth]));
    let depthAbove = 0;
    return Array.from({ length: levelsCount }, (_, index) => {
        const level = levels[index];
        if (!level?.orgUnitTypeIds.length) return 'requiredField';
        const depths = getDepths(level, depthByTypeId);
        if (depths.length > 1) return 'mixedOrgUnitTypeDepths';
        const [depth] = depths;
        if (depth === undefined) return undefined;
        const isDeeper = depth > depthAbove;
        depthAbove = Math.max(depthAbove, depth);
        return isDeeper ? undefined : 'notDeeperThanLevelAbove';
    });
};

export const configsToLevels = (
    configs: SavedPlanningConfig[],
): PlanningLevel[] => {
    const levelsCount = Math.max(0, ...configs.map(config => config.level));
    const levels = Array.from({ length: levelsCount }, () => EMPTY_LEVEL);
    configs.forEach(config => {
        levels[config.level - 1] = {
            orgUnitTypeIds: (config.org_unit_types ?? []).map(type => type.id),
            groups: (config.org_unit_groups ?? []).map(({ id, name }) => ({
                id,
                name,
            })),
        };
    });
    return levels;
};

export const getGroupIds = (level: PlanningLevel): number[] =>
    level.groups.map(group => group.id);

const isSameLevel = (a: PlanningLevel, b: PlanningLevel): boolean =>
    xor(a.orgUnitTypeIds, b.orgUnitTypeIds).length === 0 &&
    xor(getGroupIds(a), getGroupIds(b)).length === 0;

export type PlanningConfigChanges = {
    toCreate: PlanningConfigBulkCreateRequest[];
    toUpdate: PlanningConfigBulkUpdateRequest[];
    toDeleteIds: number[];
};

// Configs are matched to levels by their level number, levels beyond the form's ones are deleted.
export const getPlanningConfigChanges = (
    planningId: number,
    levels: PlanningLevel[],
    savedConfigs: SavedPlanningConfig[],
): PlanningConfigChanges => {
    const savedByLevel = new Map(
        savedConfigs.map(config => [config.level, config]),
    );
    const savedLevels = configsToLevels(savedConfigs);
    const toCreate: PlanningConfigBulkCreateRequest[] = [];
    const toUpdate: PlanningConfigBulkUpdateRequest[] = [];
    levels.forEach((level, index) => {
        const payload = {
            level: index + 1,
            org_unit_types: level.orgUnitTypeIds,
            org_unit_groups: getGroupIds(level),
        };
        const saved = savedByLevel.get(payload.level);
        if (!saved) {
            toCreate.push({ ...payload, planning: planningId });
        } else if (!isSameLevel(level, savedLevels[index])) {
            toUpdate.push({ ...payload, id: saved.id });
        }
    });
    const toDeleteIds = savedConfigs
        .filter(config => config.level > levels.length)
        .map(config => config.id);
    return { toCreate, toUpdate, toDeleteIds };
};

type LevelIssuesParams = {
    selectedTypes: LevelOrgUnitType[];
    counts: LevelOrgUnitCounts;
    hasGroups: boolean;
    levelAboveCount?: number;
};

export const getLevelIssues = ({
    selectedTypes,
    counts,
    hasGroups,
    levelAboveCount,
}: LevelIssuesParams): LevelIssue[] => {
    const issues: LevelIssue[] = selectedTypes
        .filter(type => !counts.countByTypeId.get(type.id))
        .map(type => ({ type: 'noOrgUnitOfType', typeName: type.name }));
    const { total, typesTotal } = counts;
    if (hasGroups && typesTotal > 0 && total === 0) {
        issues.push({ type: 'noOrgUnitInGroups' });
    } else if (hasGroups && typesTotal > total) {
        issues.push({
            type: 'excludedByGroups',
            excludedCount: typesTotal - total,
            totalCount: typesTotal,
        });
    }
    if (levelAboveCount === 0 && total > 0) {
        issues.push({ type: 'emptyLevelAbove' });
    }
    return issues;
};
