import { useMemo } from 'react';
import { useApiMicroplanningPlanningsOrgUnitTreeList } from 'Iaso/api/plannings';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { LevelOrgUnitNode } from '../mainPanel/types';
import { LoadedOrgUnits, indexTree } from './utils';

// The planning root and level 1: a quick first view while the full tree loads.
const QUICK_TREE_PARAMS = { max_depth: 2 };

// Without level or depth, the API returns every level of the planning.
export const usePlanningOrgUnitTree = (
    enabled: boolean,
): LoadedOrgUnits | undefined => {
    const { planning } = useAssignmentsContext();
    const { data } = useApiMicroplanningPlanningsOrgUnitTreeList(
        planning.id,
        undefined,
        { query: { enabled } },
    );
    return useMemo(() => data && indexTree(data as LevelOrgUnitNode[]), [data]);
};

type FindOrgUnits = LoadedOrgUnits & {
    isFullTree: boolean;
};

export const useFindOrgUnits = (): FindOrgUnits | undefined => {
    const { planning } = useAssignmentsContext();
    const fullTree = usePlanningOrgUnitTree(true);
    const { data: quickTree } = useApiMicroplanningPlanningsOrgUnitTreeList(
        planning.id,
        QUICK_TREE_PARAMS,
        { query: { enabled: !fullTree } },
    );
    return useMemo(() => {
        if (fullTree) return { ...fullTree, isFullTree: true };
        if (!quickTree) return undefined;
        return {
            ...indexTree(quickTree as LevelOrgUnitNode[], 0),
            isFullTree: false,
        };
    }, [fullTree, quickTree]);
};
