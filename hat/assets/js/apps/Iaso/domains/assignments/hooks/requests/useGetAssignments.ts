import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { AssignmentApi } from '../../types/assigment';
import { Team } from '../../types/team';

type Option = {
    planning: string | undefined;
};

export type AssignmentsResult = {
    assignments: AssignmentApi[];
    allAssignments: AssignmentApi[];
};

const getAssignments = async (options: Option): Promise<AssignmentApi[]> => {
    const url = makeUrlWithParams('/api/microplanning/assignments/', options);
    return getRequest(url) as Promise<AssignmentApi[]>;
};

export const useGetAssignments = (
    options: Option,
    currentTeam?: Team,
): UseQueryResult<AssignmentsResult, Error> => {
    const queryKey: any[] = ['assignmentsList'];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getAssignments(options), undefined, {
        enabled: Boolean(options.planning),
        select: data => {
            const filteredAssignments = data.filter(assignment => {
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
            });
            return {
                assignments: filteredAssignments,
                allAssignments: data,
            };
        },
    });
};
