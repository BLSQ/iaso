import { useMemo } from 'react';
import { TeamType } from 'Iaso/domains/teams/constants';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { usePlanningAssignments } from '../api/usePlanningAssignments';
import { OrgUnitRow } from './types';
import { useLevelOrgUnits } from './useLevelOrgUnits';
import {
    getAssigneeByOrgUnitId,
    getLevelOrgUnitRows,
    getTeamIdByOrgUnitId,
} from './utils';

type LevelOrgUnitRows = {
    rows: OrgUnitRow[];
    isFetching: boolean;
};

// The org units the selected team's members work on, sorted by name.
export const useLevelOrgUnitRows = (): LevelOrgUnitRows => {
    const { planning, tree, selectedTeam, selectedLevel } =
        useAssignmentsContext();
    const { parents, isFetching } = useLevelOrgUnits(selectedLevel);
    const { data: assignments } = usePlanningAssignments(planning.id);
    const rows = useMemo(
        () =>
            getLevelOrgUnitRows({
                parents: parents ?? [],
                assigneeByOrgUnitId: getAssigneeByOrgUnitId(
                    tree,
                    assignments ?? [],
                ),
                teamIdByOrgUnitId: getTeamIdByOrgUnitId(assignments ?? []),
                showPoints: selectedTeam.type === TeamType.enum.TEAM_OF_USERS,
            }),
        [parents, selectedTeam.type, tree, assignments],
    );
    return { rows, isFetching };
};
