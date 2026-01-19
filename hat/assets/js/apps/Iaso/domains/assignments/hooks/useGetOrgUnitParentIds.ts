import { useMemo } from 'react';
import { Planning } from '../../plannings/types';
import { Team } from '../../teams/types/team';
import { AssignmentsApi } from '../types/assigment';

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
                if (currentTeam?.id !== planning.team_details?.id) {
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
                    orgUnitParentIds = planning.org_unit_details
                        ? [planning.org_unit_details.id]
                        : [];
                }
            }
        }
        return orgUnitParentIds;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTeam, allAssignments]);
};
