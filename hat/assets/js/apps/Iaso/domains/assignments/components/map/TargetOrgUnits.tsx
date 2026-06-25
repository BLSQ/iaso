import { FunctionComponent, useMemo } from 'react';
import React from 'react';
import { Pane } from 'react-leaflet';
import { useGetAssignmentColor } from 'Iaso/domains/app/hooks/useGetAssignmentColor';
import { FilterOrgUnitsResult } from 'Iaso/domains/assignments/utils';
import { OrgUnitTypeHierarchyDropdownValue } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { Planning } from 'Iaso/domains/plannings/types';
import { Team } from 'Iaso/domains/teams/types/team';
import { AssignmentsResult } from '../../types/assigment';
import { filterOrgUnits, getValidShapes, getValidLocations } from '../../utils';
import { MAP_PANE_Z_INDEX } from './AssignmentsMap';
import { MapLocation } from './MapLocation';
import { MapShape } from './MapShape';

type Props = {
    orgUnits?: PlanningOrgUnits[];
    canAssign: boolean;
    handleSaveAssignment: (id: number) => void;
    planning?: Planning;
    assignments?: AssignmentsResult;
    selectedOrgUnitTypes: OrgUnitTypeHierarchyDropdownValue[];
    rootTeam?: Team;
};

export const TargetOrgUnits: FunctionComponent<Props> = ({
    orgUnits,
    canAssign,
    handleSaveAssignment,
    planning,
    assignments,
    selectedOrgUnitTypes,
    rootTeam,
}) => {
    const getAssignmentColor = useGetAssignmentColor(assignments, rootTeam);
    const targetOrgUnitsShapes: FilterOrgUnitsResult = useMemo(
        () =>
            filterOrgUnits(
                getValidShapes(orgUnits, planning) ?? [],
                assignments,
                selectedOrgUnitTypes,
            ),
        [orgUnits, planning, assignments, selectedOrgUnitTypes],
    );

    const targetOrgUnitsLocations: FilterOrgUnitsResult = useMemo(
        () =>
            filterOrgUnits(
                getValidLocations(orgUnits) ?? [],
                assignments,
                selectedOrgUnitTypes,
            ),
        [orgUnits, assignments, selectedOrgUnitTypes],
    );
    return (
        <>
            <Pane
                name="target-org-units-shapes-unassigned"
                style={{
                    zIndex: MAP_PANE_Z_INDEX.targetShapesUnassigned,
                }}
            >
                {targetOrgUnitsShapes.unassigned?.map(ou => (
                    <MapShape
                        key={ou.id}
                        ou={ou}
                        canAssign={canAssign}
                        handleSaveAssignment={handleSaveAssignment}
                        getAssignmentColor={getAssignmentColor}
                        opacity={0.3}
                    />
                ))}
            </Pane>
            <Pane
                name="target-org-units-shapes-assigned"
                style={{
                    zIndex: MAP_PANE_Z_INDEX.targetShapesAssigned,
                }}
            >
                {targetOrgUnitsShapes.assigned?.map(ou => (
                    <MapShape
                        key={ou.id}
                        ou={ou}
                        canAssign={canAssign}
                        handleSaveAssignment={handleSaveAssignment}
                        getAssignmentColor={getAssignmentColor}
                    />
                ))}
            </Pane>
            <Pane
                name="target-org-units-points-assigned"
                style={{
                    zIndex: MAP_PANE_Z_INDEX.targetPointsAssigned,
                }}
            >
                {targetOrgUnitsLocations.assigned?.map(ou => (
                    <MapLocation
                        key={ou.id}
                        ou={ou}
                        canAssign={canAssign}
                        handleSaveAssignment={handleSaveAssignment}
                        getAssignmentColor={getAssignmentColor}
                    />
                ))}
            </Pane>
            <Pane
                name="target-org-units-points-unassigned"
                style={{
                    zIndex: MAP_PANE_Z_INDEX.targetPointsUnassigned,
                }}
            >
                {targetOrgUnitsLocations.unassigned?.map(ou => (
                    <MapLocation
                        key={ou.id}
                        ou={ou}
                        canAssign={canAssign}
                        handleSaveAssignment={handleSaveAssignment}
                        getAssignmentColor={getAssignmentColor}
                    />
                ))}
            </Pane>
        </>
    );
};
