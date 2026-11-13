import { useMemo } from 'react';
import { usePlanningOrgUnits } from '../usePlanningOrgUnitTree';
import { LevelOrgUnitNode } from './types';
import { getOrgUnitsOfLevel } from './utils';

type LevelOrgUnits = {
    // Org units of the level, holding the levels below.
    parents?: LevelOrgUnitNode[];
    isFetching: boolean;
};

export const useLevelOrgUnits = (level: number): LevelOrgUnits => {
    const { orgUnits, isFetching } = usePlanningOrgUnits(level, 3);
    const parents = useMemo(
        () =>
            orgUnits &&
            getOrgUnitsOfLevel(orgUnits.roots, level - orgUnits.rootLevel),
        [orgUnits, level],
    );
    return { parents, isFetching };
};
