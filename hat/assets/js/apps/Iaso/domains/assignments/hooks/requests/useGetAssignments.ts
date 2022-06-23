import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { AssignmentApi } from '../../types/assigment';
import { Team } from '../../types/team';

type Option = {
    planningId: string;
};

const getAssignments = async (options: Option): Promise<AssignmentApi[]> => {
    const url = makeUrlWithParams('/api/microplanning/assignments', options);
    return getRequest(url) as Promise<AssignmentApi[]>;
};

export const useGetAssignments = (
    options: Option,
    currentTeam: Team | undefined,
    baseOrgunitType: string | undefined,
): UseQueryResult<AssignmentApi[], Error> => {
    const queryKey: any[] = ['assignmentsList'];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getAssignments(options), undefined, {
        select: data => {
            return data
                .filter(assignment => {
                    if (currentTeam?.type) {
                        if (currentTeam.type === 'TEAM_OF_TEAMS') {
                            return currentTeam.sub_teams.some(
                                subTeam => assignment.team === subTeam,
                            );
                        }
                        if (currentTeam.type === 'TEAM_OF_USERS') {
                            return currentTeam.users.some(
                                user => assignment.user === user,
                            );
                        }
                    }
                    return false;
                })
                .filter(
                    assignment =>
                        !baseOrgunitType ||
                        (baseOrgunitType &&
                            assignment.org_unit_details.org_unit_type ===
                                parseInt(baseOrgunitType, 10)),
                );
        },
    });
};
