import { Theme } from '@material-ui/core/styles';
// types
import { AssignmentsApi, AssignmentApi } from './types/assigment';
import { OrgUnitMarker, OrgUnitShape } from './types/locations';
import { DropdownTeamsOptions } from './types/team';

type OrgUnitAssignedTeam = {
    assignment: AssignmentApi | undefined;
    assignedTeam: DropdownTeamsOptions | undefined;
};

export const getOrgUnitAssignation = (
    assignments: AssignmentsApi,
    orgUnit: OrgUnitShape | OrgUnitMarker,
    teams: DropdownTeamsOptions[],
): OrgUnitAssignedTeam => {
    let assignedTeam;
    const assignment = assignments.find(ass => ass.org_unit === orgUnit.id);
    if (assignment) {
        assignedTeam = teams.find(team => team.original.id === assignment.team);
    }
    return {
        assignment,
        assignedTeam,
    };
};

export const getLocationColor = (
    assignments: AssignmentsApi,
    orgUnit: OrgUnitShape | OrgUnitMarker,
    teams: DropdownTeamsOptions[],
    theme: Theme,
): string => {
    let color = theme.palette.grey[500];
    const orgUnitAssignation = getOrgUnitAssignation(
        assignments,
        orgUnit,
        teams,
    );
    if (orgUnitAssignation.assignedTeam) {
        color = orgUnitAssignation.assignedTeam.color;
    }
    return color;
};
