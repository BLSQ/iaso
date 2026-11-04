import { TeamRetrieve } from 'Iaso/api/teams';
import { defaultAssignmentColor } from 'Iaso/domains/assignments/constants/colors';
import { AssignmentsResult } from 'Iaso/domains/assignments/types/assigment';

export const useGetAssignmentColor = (
    assignments?: AssignmentsResult,
    rootTeam?: TeamRetrieve,
) => {
    return (orgUnitId: number) => {
        const assignment = assignments?.allAssignments?.find(
            assignment => assignment.org_unit === orgUnitId,
        );
        const user = rootTeam?.users?.find(
            user => user.id === assignment?.user,
        );
        const team = rootTeam?.sub_teams?.find(
            team => team.id === assignment?.team,
        );
        return user?.color || team?.color || defaultAssignmentColor;
    };
};
