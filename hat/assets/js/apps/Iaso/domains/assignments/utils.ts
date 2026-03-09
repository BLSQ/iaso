// types
import { Profile } from '../../utils/usersUtils';
import { OrgUnit } from '../orgUnits/types/orgUnit';
import { DropdownTeamsOptions } from '../teams/types/team';
import { AssignmentsApi, AssignmentApi } from './types/assigment';
import { OrgUnitMarker, OrgUnitShape, BaseLocation } from './types/locations';

export type AssignedUser = Profile & {
    color: string;
};

export type OrgUnitAssignedTeamUser = {
    assignment: AssignmentApi | undefined;
    assignedTeam: DropdownTeamsOptions | undefined;
    assignedUser: AssignedUser | undefined;
    emptyAssignment: AssignmentApi | undefined;
};

export const getOrgUnitAssignation = (
    assignments: AssignmentsApi,
    orgUnit: OrgUnitShape | OrgUnitMarker | BaseLocation | OrgUnit,
    teams: DropdownTeamsOptions[],
    profiles: Profile[],
    currentType: 'TEAM_OF_TEAMS' | 'TEAM_OF_USERS' | undefined,
): OrgUnitAssignedTeamUser => {
    let assignedTeam;
    let assignedUser;
    const assignment = assignments.find(
        ass => ass.org_unit === orgUnit.id && Boolean(ass.team || ass.user),
    );
    const emptyAssignment = assignments.find(
        ass => ass.org_unit === orgUnit.id && !ass.team && !ass.user,
    );
    if (assignment && (currentType === 'TEAM_OF_TEAMS' || !currentType)) {
        assignedTeam = teams.find(team => team.original.id === assignment.team);
    }
    if (assignment && (currentType === 'TEAM_OF_USERS' || !currentType)) {
        assignedUser = profiles.find(
            profile => profile.user_id === assignment.user,
        );
    }
    return {
        assignment,
        assignedTeam,
        assignedUser,
        emptyAssignment,
    };
};
