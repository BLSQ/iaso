import { useMemo } from 'react';
import { Team } from '../../teams/types/team';
import { AssignmentsApi } from '../types/assigment';
import { Planning } from '../types/planning';

type Props = {
    currentTeam: Team | undefined;
    allAssignments: AssignmentsApi;
    planning: Planning | undefined;
    isLoadingAssignments: boolean;
};

export const useGetOrgUnitParentIds = ({
    currentTeam,
    allAssignments,
    planning,
    isLoadingAssignments,
}: Props): number[] | undefined => {
    // change parent regarding the team selected
    // if no assignation use planning?.org_unit,
    // else use assignation
    return useMemo(() => {
        let orgUnitParentIds: number[] | undefined;
        if (planning && !isLoadingAssignments) {
            if (currentTeam) {
                if (currentTeam?.id !== planning.team) {
                    const existingAssignmentsForTeamOrUser =
                        allAssignments.filter(
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
        }
        return orgUnitParentIds;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTeam, allAssignments]);
};
