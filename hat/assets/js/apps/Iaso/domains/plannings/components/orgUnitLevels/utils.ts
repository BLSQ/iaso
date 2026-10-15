import { uniq } from 'lodash';
import { TeamNode } from '../teamHierarchy/types';
import {
    LevelMembers,
    LevelOrgUnitType,
    LevelTypeError,
    PlanningLevel,
} from './types';

export const EMPTY_LEVEL: PlanningLevel = { orgUnitTypeIds: [], groupIds: [] };

// Level N holds the teams at depth N of the hierarchy, and the users of the teams at depth N - 1.
export const getLevelMembers = (root: TeamNode): LevelMembers[] => {
    const teamsCounts: number[] = [];
    const userIdsByLevel: Set<number>[] = [];
    const visit = ({ team, children }: TeamNode, depth: number) => {
        if (depth > 0) {
            teamsCounts[depth - 1] = (teamsCounts[depth - 1] ?? 0) + 1;
        }
        if (team.users_details?.length) {
            const userIds = userIdsByLevel[depth] ?? new Set<number>();
            team.users_details.forEach(user => userIds.add(user.id));
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
