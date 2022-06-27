// types
import { AssignmentsApi, AssignmentApi } from './types/assigment';
import { OrgUnitMarker, OrgUnitShape } from './types/locations';
import { DropdownTeamsOptions } from './types/team';
import { Profile } from '../../utils/usersUtils';

export type AssignedUser = Profile & {
    color: string;
};

type OrgUnitAssignedTeamUser = {
    assignment: AssignmentApi | undefined;
    assignedTeam: DropdownTeamsOptions | undefined;
    assignedUser: AssignedUser | undefined;
    emptyAssignment: AssignmentApi | undefined;
};

export const getOrgUnitAssignation = (
    assignments: AssignmentsApi,
    orgUnit: OrgUnitShape | OrgUnitMarker,
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

type OrgunitParentProps = {
    currentTeam?: DropdownTeamsOptions;
    currentUser?: AssignedUser;
    teams?: DropdownTeamsOptions[];
    users?: Profile[];
};

export const getParentTeam = ({
    currentTeam,
    currentUser,
    teams,
}: OrgunitParentProps): DropdownTeamsOptions | undefined => {
    if (currentTeam && teams) {
        return teams.find(team =>
            team.original.sub_teams.includes(currentTeam.original.id),
        );
    }
    if (currentUser && teams) {
        return teams.find(team =>
            team.original.users.includes(currentUser.user_id),
        );
    }
    return undefined;
};
