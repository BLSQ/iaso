import { textPlaceholder } from 'bluesquare-components';

// Percentages from the API have 1 decimal, the page displays them rounded
export const formatPercent = (value?: number | null): string =>
    value === null || value === undefined
        ? textPlaceholder
        : `${Math.round(value)}%`;

type OrgUnitTypeWithDepth = { id: number; depth?: number | null };

// Org unit types under which nothing can be expected for the form: not a target type,
// and at or below the level of the shallowest target type (so no target below them).
// Forms targeting org unit groups can have targets of any type: nothing is excluded.
export const getNotApplicableTypeIds = (
    orgUnitTypes: OrgUnitTypeWithDepth[],
    targetTypeIds: number[] = [],
    targetGroupIds: number[] = [],
): number[] => {
    if (targetGroupIds.length > 0) return [];
    const targetDepths = orgUnitTypes
        .filter(type => targetTypeIds.includes(type.id))
        .map(type => type.depth)
        .filter((depth): depth is number => typeof depth === 'number');
    if (targetDepths.length === 0) return [];
    const minTargetDepth = Math.min(...targetDepths);
    return orgUnitTypes
        .filter(
            type =>
                !targetTypeIds.includes(type.id) &&
                typeof type.depth === 'number' &&
                type.depth >= minTargetDepth,
        )
        .map(type => type.id);
};
