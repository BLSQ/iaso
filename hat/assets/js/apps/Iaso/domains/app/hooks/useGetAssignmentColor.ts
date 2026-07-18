import { defaultAssignmentColor } from 'Iaso/domains/assignments/constants/colors';
import { AssignmentsResult } from 'Iaso/domains/assignments/types/assigment';
import { Team } from 'Iaso/domains/teams/types/team';

export const useGetAssignmentColor = (
    assignments?: AssignmentsResult,
    rootTeam?: Team,
) => {
    return (orgUnitId: number) => {
        const assignment = assignments?.allAssignments?.find(
            assignment => assignment.org_unit === orgUnitId,
        );
        const user = rootTeam?.users_details?.find(
            user => user.id === assignment?.user,
        );
        const team = rootTeam?.sub_teams_details?.find(
            team => team.id === assignment?.team,
        );
        return user?.color || team?.color || defaultAssignmentColor;
    };
};
