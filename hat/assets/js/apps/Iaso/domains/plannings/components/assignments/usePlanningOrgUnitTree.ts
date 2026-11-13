import { useMemo } from 'react';
import { useQueryClient } from 'react-query';
import {
    getApiMicroplanningPlanningsOrgUnitTreeListQueryKey,
    useApiMicroplanningPlanningsOrgUnitTreeList,
} from 'Iaso/api/plannings';
import { useAssignmentsContext } from '../../contexts/AssignmentsContext';
import { LoadedOrgUnits, indexTree } from './findOrgUnit/utils';
import { LevelOrgUnitNode } from './mainPanel/types';
import { getLevelTreeParams } from './mainPanel/utils';

// Without level or depth, the API returns every level of the planning.
export const usePlanningOrgUnitTree = (
    enabled: boolean,
): { orgUnits?: LoadedOrgUnits; isLoading: boolean } => {
    const { planning } = useAssignmentsContext();
    const { data, isLoading } = useApiMicroplanningPlanningsOrgUnitTreeList(
        planning.id,
        undefined,
        { query: { enabled } },
    );
    const orgUnits = useMemo(
        () => data && indexTree(data as LevelOrgUnitNode[]),
        [data],
    );
    return { orgUnits, isLoading };
};

type PlanningOrgUnits = {
    orgUnits?: LoadedOrgUnits & {
        // 0 for the full tree, the requested level for the partial one.
        rootLevel: number;
        isFullTree: boolean;
    };
    isFetching: boolean;
    isLoading: boolean;
    isLoadingFullTree: boolean;
};

// A partial tree paints first; the full tree then loads in the background and replaces it.
export const usePlanningOrgUnits = (
    partialLevel: number,
    partialDepths: number,
): PlanningOrgUnits => {
    const { planning } = useAssignmentsContext();
    const queryClient = useQueryClient();
    const hasFullTree = Boolean(
        queryClient.getQueryData(
            getApiMicroplanningPlanningsOrgUnitTreeListQueryKey(planning.id),
        ),
    );
    const {
        data: partialTree,
        isFetching,
        isLoading,
    } = useApiMicroplanningPlanningsOrgUnitTreeList(
        planning.id,
        getLevelTreeParams(partialLevel, partialDepths),
        { query: { enabled: !hasFullTree } },
    );
    const { orgUnits: fullTree, isLoading: isLoadingFull } =
        usePlanningOrgUnitTree(hasFullTree || Boolean(partialTree));
    const orgUnits = useMemo(() => {
        if (fullTree) return { ...fullTree, rootLevel: 0, isFullTree: true };
        if (!partialTree) return undefined;
        return {
            // The deepest org units of the partial tree come without their children.
            ...indexTree(partialTree as LevelOrgUnitNode[], partialDepths - 2),
            rootLevel: partialLevel,
            isFullTree: false,
        };
    }, [fullTree, partialTree, partialDepths, partialLevel]);
    return {
        orgUnits,
        isFetching: !fullTree && isFetching,
        isLoading,
        isLoadingFullTree: isLoading || isLoadingFull,
    };
};
