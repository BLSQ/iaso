import { useApiMicroplanningPlanningsOrgUnitTreeList } from 'Iaso/api/plannings';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { LevelOrgUnitNode } from './types';
import { getLevelTreeParams } from './utils';

type LevelOrgUnits = {
    // Org units of the level, holding the two levels below.
    parents?: LevelOrgUnitNode[];
    isFetching: boolean;
};

export const useLevelOrgUnits = (level: number): LevelOrgUnits => {
    const { planning } = useAssignmentsContext();
    const { data, isFetching } = useApiMicroplanningPlanningsOrgUnitTreeList(
        planning.id,
        getLevelTreeParams(level, 3),
    );
    return { parents: data as LevelOrgUnitNode[] | undefined, isFetching };
};
