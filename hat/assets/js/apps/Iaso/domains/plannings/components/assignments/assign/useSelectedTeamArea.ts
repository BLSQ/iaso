import { useMemo } from 'react';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { usePlanningAssignments } from '../api/usePlanningAssignments';
import { getTeamAreaOrgUnitIds, getTeamIdsWithArea } from './utils';

type SelectedTeamArea = {
    areaOrgUnitIds?: Set<number>;
    hasArea: boolean;
};

export const useSelectedTeamArea = (): SelectedTeamArea => {
    const { planning, selectedTeam, selectedLevel } = useAssignmentsContext();
    const { data: assignments } = usePlanningAssignments(planning.id);
    return useMemo(() => {
        const areaOrgUnitIds = getTeamAreaOrgUnitIds(
            selectedTeam.id,
            selectedLevel === 0,
            assignments ?? [],
        );
        return {
            areaOrgUnitIds,
            hasArea: !areaOrgUnitIds || areaOrgUnitIds.size > 0,
        };
    }, [selectedTeam.id, selectedLevel, assignments]);
};

export const useTeamIdsWithArea = (): Set<number> => {
    const { planning, tree } = useAssignmentsContext();
    const { data: assignments } = usePlanningAssignments(planning.id);
    return useMemo(
        () => getTeamIdsWithArea(tree.id, assignments ?? []),
        [tree.id, assignments],
    );
};
