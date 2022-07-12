import { useMemo } from 'react';
import { AssignmentsApi } from '../types/assigment';
import { Planning } from '../types/planning';
import { Team } from '../types/team';

type Props = {
    currentTeam: Team | undefined;
    allAssignments: AssignmentsApi;
    planning: Planning | undefined;
};

export const useGetOrgUnitParentIds = ({
    currentTeam,
    allAssignments,
    planning,
}: Props): number[] | undefined => {
    // change parent regarding the team selected
    // if no assignation use planning?.org_unit,
    // else use assignation
    return useMemo(() => {
        let orgUnitParentIds: number[] | undefined;
        if (planning) {
            if (currentTeam && currentTeam?.id !== planning.team) {
                const existingAssignmentsForTeamOrUser = allAssignments.filter(
                    assignment => assignment.team === currentTeam.id,
                );
                if (existingAssignmentsForTeamOrUser) {
                    orgUnitParentIds = existingAssignmentsForTeamOrUser.map(
                        assignment => assignment.org_unit,
                    );
                }
            } else {
                orgUnitParentIds = [planning.org_unit];
            }
        }
        return orgUnitParentIds;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTeam]);
};
