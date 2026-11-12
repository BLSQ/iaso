import { useMemo } from 'react';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { usePlanningAssignments } from '../api/usePlanningAssignments';
import { Assignment } from '../mainPanel/types';
import { useLevelOrgUnits } from '../mainPanel/useLevelOrgUnits';
import { useSelectedTeamArea } from './useSelectedTeamArea';
import {
    getAssignableOrgUnitIds,
    getOrgUnitIdsWithAssignmentsBelow,
} from './utils';

type AssignableOrgUnits = {
    assignments: Assignment[];
    // The org units the selected team's members can be given.
    assignableOrgUnitIds: Set<number>;
    orgUnitIdsWithAssignmentsBelow: Set<number>;
    orgUnitNameById: Map<number, string>;
};

const NO_ASSIGNMENT: Assignment[] = [];

export const useAssignableOrgUnits = (): AssignableOrgUnits => {
    const { planning, selectedLevel } = useAssignmentsContext();
    const { data: assignments = NO_ASSIGNMENT } = usePlanningAssignments(
        planning.id,
    );
    const { parents } = useLevelOrgUnits(selectedLevel);
    const { areaOrgUnitIds } = useSelectedTeamArea();
    return useMemo(() => {
        const levelOrgUnits = parents ?? [];
        return {
            assignments,
            assignableOrgUnitIds: getAssignableOrgUnitIds(
                levelOrgUnits,
                areaOrgUnitIds,
            ),
            orgUnitIdsWithAssignmentsBelow: getOrgUnitIdsWithAssignmentsBelow(
                levelOrgUnits,
                assignments,
            ),
            orgUnitNameById: new Map(
                levelOrgUnits
                    .flatMap(parent => parent.children)
                    .map(orgUnit => [orgUnit.id, orgUnit.name]),
            ),
        };
    }, [parents, areaOrgUnitIds, assignments]);
};
