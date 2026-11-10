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
): LoadedOrgUnits | undefined => {
    const { planning } = useAssignmentsContext();
    const { data } = useApiMicroplanningPlanningsOrgUnitTreeList(
        planning.id,
        undefined,
        { query: { enabled } },
    );
    return useMemo(() => data && indexTree(data as LevelOrgUnitNode[]), [data]);
};

type PlanningOrgUnits = {
    orgUnits?: LoadedOrgUnits & {
        // 0 for the full tree, the requested level for the partial one.
        rootLevel: number;
        isFullTree: boolean;
    };
    isFetching: boolean;
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
    const { data: partialTree, isFetching } =
        useApiMicroplanningPlanningsOrgUnitTreeList(
            planning.id,
            getLevelTreeParams(partialLevel, partialDepths),
            { query: { enabled: !hasFullTree } },
        );
    const fullTree = usePlanningOrgUnitTree(
        hasFullTree || Boolean(partialTree),
    );
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
    return { orgUnits, isFetching: !fullTree && isFetching };
};
