import React, { FunctionComponent, useState } from 'react';
import { Grid } from '@material-ui/core';
import { useTheme, Theme } from '@material-ui/core/styles';

import {
    // @ts-ignore
    Table,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';
import { getOrgUnitAssignation } from '../utils';

import { AssignmentsMap } from './AssignmentsMap';

import { AssignmentsApi, SaveAssignmentQuery } from '../types/assigment';
import { Planning } from '../types/planning';
import { Team, DropdownTeamsOptions, SubTeam } from '../types/team';
import { OrgUnitMarker, OrgUnitShape } from '../types/locations';

import { getColumns } from '../configs/AssignmentsMapTabColumns';

import { useSaveAssignment } from '../hooks/requests/useSaveAssignment';

type Props = {
    assignments: AssignmentsApi;
    planning: Planning | undefined;
    currentTeam: Team | undefined;
    teams: DropdownTeamsOptions[];
    // eslint-disable-next-line no-unused-vars
    setTeamColor: (color: string, teamId: number) => void;
};

export const AssignmentsMapTab: FunctionComponent<Props> = ({
    assignments,
    planning,
    currentTeam,
    teams,
    setTeamColor,
}) => {
    const { formatMessage } = useSafeIntl();
    const theme: Theme = useTheme();

    const { mutateAsync: createAssignment } = useSaveAssignment('create');
    const { mutateAsync: editAssignment } = useSaveAssignment('edit');
    const [selectedTeam, setSelectedTeam] = useState<SubTeam | undefined>(
        currentTeam?.sub_teams_details[0],
    );
    const handleClick = async (
        selectedOrgUnit: OrgUnitShape | OrgUnitMarker,
    ) => {
        const { assignment, assignedTeam } = getOrgUnitAssignation(
            assignments,
            selectedOrgUnit,
            teams,
        );
        if (planning && selectedTeam) {
            let saveParams: SaveAssignmentQuery = {
                planning: planning.id,
                org_unit: selectedOrgUnit.id,
                team: selectedTeam.id,
            };
            if (assignment) {
                if (assignedTeam) {
                    if (selectedTeam.id !== assignedTeam.original.id) {
                        // update assignment
                        saveParams = {
                            id: assignment.id,
                            ...saveParams,
                        };
                    } else {
                        // fake delete assignment, remove team
                        saveParams = {
                            ...saveParams,
                            team: null,
                            id: assignment.id,
                        };
                    }
                } else {
                    // update assignment after fake delete
                    saveParams = {
                        id: assignment.id,
                        ...saveParams,
                    };
                }

                editAssignment(saveParams);
            } else {
                createAssignment(saveParams);
            }
        }
    };
    return (
        <Grid container spacing={2}>
            <Grid item xs={5}>
                <Table
                    data={currentTeam?.sub_teams_details || []}
                    showPagination={false}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    countOnTop={false}
                    marginTop={false}
                    columns={getColumns({
                        formatMessage,
                        assignments,
                        teams,
                        setTeamColor,
                        theme,
                        selectedTeam,
                        setSelectedTeam,
                    })}
                    count={currentTeam?.sub_teams_details?.length ?? 0}
                    extraProps={{
                        // adding this will force table to
                        // re render while selecting a team, changing team color, changing assignments
                        selectedTeamId: selectedTeam?.id,
                        teams,
                        assignments,
                    }}
                />
            </Grid>
            <Grid item xs={7}>
                <AssignmentsMap
                    assignments={assignments}
                    planning={planning}
                    teams={teams}
                    handleClick={handleClick}
                />
            </Grid>
        </Grid>
    );
};
