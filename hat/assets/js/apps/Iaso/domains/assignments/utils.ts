import L from 'leaflet';
import { OrgUnitTypeHierarchyDropdownValue } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { Planning } from 'Iaso/domains/plannings/types';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { isValidCoordinate } from 'Iaso/utils/map/mapUtils';
import { SubTeam, User } from '../teams/types/team';
import { AssignmentsResult } from './types/assigment';

export const defaultViewport = {
    center: L.latLng(1, 20),
    zoom: 3.25,
};
export const boundsOptions: L.FitBoundsOptions = {
    padding: L.point(25, 25),
    maxZoom: 12,
};

export const getValidShapes = (
    orgUnits?: PlanningOrgUnits[],
    planning?: Planning,
) => {
    return orgUnits?.filter(
        ou =>
            ou.has_geo_json &&
            planning?.target_org_unit_type_details?.some(
                t => t.id === ou.org_unit_type_id,
            ),
    );
};

export const getValidLocations = (orgUnits?: PlanningOrgUnits[]) => {
    return (
        orgUnits?.filter(ou => isValidCoordinate(ou.latitude, ou.longitude)) ??
        []
    );
};

export const isOuAssigned = (
    ou: PlanningOrgUnits,
    assignments?: AssignmentsResult,
): boolean => {
    const assignment = assignments?.allAssignments?.find(
        a => a.org_unit === ou.id,
    );
    return Boolean(assignment?.user || assignment?.team);
};

export const isOrgunitVisible = (
    ou: PlanningOrgUnits,
    selectedOrgUnitType?: OrgUnitTypeHierarchyDropdownValue[],
): boolean => {
    return Boolean(
        selectedOrgUnitType?.some(t => t.value === ou.org_unit_type_id),
    );
};

export type FilterOrgUnitsResult = {
    unassigned: PlanningOrgUnits[];
    assigned: PlanningOrgUnits[];
};

export const filterOrgUnits = (
    orgUnits: PlanningOrgUnits[],
    assignments?: AssignmentsResult,
    selectedOrgUnitType?: OrgUnitTypeHierarchyDropdownValue[],
): FilterOrgUnitsResult => {
    return {
        unassigned: orgUnits
            ?.filter(ou => !isOuAssigned(ou, assignments))
            .filter(ou => isOrgunitVisible(ou, selectedOrgUnitType)),
        assigned: orgUnits
            ?.filter(ou => isOuAssigned(ou, assignments))
            .filter(ou => isOrgunitVisible(ou, selectedOrgUnitType)),
    };
};

export const assignmentsCountForUser = (
    user: User,
    assignments?: AssignmentsResult,
) => {
    return (
        assignments?.allAssignments?.filter(
            assignment => assignment.user === user.id,
        ).length || 0
    );
};
export const countTeams = (
    subTeam: SubTeam,
    assignments?: AssignmentsResult,
) => {
    return (
        assignments?.allAssignments?.filter(
            assignment => assignment.team === subTeam.id,
        ).length || 0
    );
};
