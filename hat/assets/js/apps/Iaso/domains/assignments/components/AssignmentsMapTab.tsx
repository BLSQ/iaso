import React, { FunctionComponent, useState, useEffect } from 'react';
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
import { Team, DropdownTeamsOptions, SubTeam, User } from '../types/team';
import { OrgUnitMarker, OrgUnitShape } from '../types/locations';
import { Profile } from '../../../utils/usersUtils';

import { getColumns } from '../configs/AssignmentsMapTabColumns';

type Props = {
    assignments: AssignmentsApi;
    planning: Planning | undefined;
    currentTeam: Team | undefined;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    // eslint-disable-next-line no-unused-vars
    setItemColor: (color: string, teamId: number) => void;
    // eslint-disable-next-line no-unused-vars
    saveAssignment: (params: SaveAssignmentQuery) => void;
};

export const AssignmentsMapTab: FunctionComponent<Props> = ({
    assignments,
    planning,
    currentTeam,
    teams,
    profiles,
    setItemColor,
    saveAssignment,
}) => {
    const { formatMessage } = useSafeIntl();
    const theme: Theme = useTheme();

    const [selectedItem, setSelectedItem] = useState<
        SubTeam | User | undefined
    >();
    const handleClick = async (
        selectedOrgUnit: OrgUnitShape | OrgUnitMarker,
    ) => {
        const { assignment, assignedTeam, assignedUser } =
            getOrgUnitAssignation(
                assignments,
                selectedOrgUnit,
                teams,
                profiles,
                currentTeam?.type,
            );
        // TODO: make it better, copy paste for now...
        if (planning && selectedItem && currentTeam?.type === 'TEAM_OF_TEAMS') {
            let saveParams: SaveAssignmentQuery = {
                planning: planning.id,
                org_unit: selectedOrgUnit.id,
                team: selectedItem.id,
            };
            if (assignment) {
                if (assignedTeam) {
                    if (selectedItem.id !== assignedTeam.original.id) {
                        // update assignment
                        saveParams = {
                            id: assignment.id,
                            ...saveParams,
                        };
                    } else {
                        // fake delete assignment, remove team / user
                        saveParams = {
                            ...saveParams,
                            team: null,
                            user: null,
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
            }
            saveAssignment(saveParams);
        }
        if (planning && selectedItem && currentTeam?.type === 'TEAM_OF_USERS') {
            let saveParams: SaveAssignmentQuery = {
                planning: planning.id,
                org_unit: selectedOrgUnit.id,
                user: selectedItem.id,
            };
            if (assignment) {
                if (assignedUser) {
                    if (selectedItem.id !== assignedUser.user_id) {
                        // update assignment
                        saveParams = {
                            id: assignment.id,
                            ...saveParams,
                        };
                    } else {
                        // fake delete assignment, remove team / user
                        saveParams = {
                            ...saveParams,
                            team: null,
                            user: null,
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
            }
            saveAssignment(saveParams);
        }
    };

    useEffect(() => {
        if (planning && !selectedItem && currentTeam) {
            if (currentTeam.type === 'TEAM_OF_USERS') {
                setSelectedItem(currentTeam.users_details[0]);
            }
            if (currentTeam.type === 'TEAM_OF_TEAMS') {
                setSelectedItem(currentTeam.sub_teams_details[0]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planning]);
    const data =
        currentTeam?.type === 'TEAM_OF_USERS'
            ? currentTeam.users_details
            : currentTeam?.sub_teams_details;
    return (
        <Grid container spacing={2}>
            <Grid item xs={5}>
                <Table
                    data={data || []}
                    showPagination={false}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    countOnTop={false}
                    marginTop={false}
                    columns={getColumns({
                        formatMessage,
                        assignments,
                        teams,
                        profiles,
                        setItemColor,
                        theme,
                        selectedItem,
                        setSelectedItem,
                        currentTeam,
                    })}
                    count={currentTeam?.sub_teams_details?.length ?? 0}
                    extraProps={{
                        // adding this will force table to
                        // re render while selecting a team, changing team color, changing assignments
                        selectedItemId: selectedItem?.id,
                        teams,
                        profiles,
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
                    currentTeam={currentTeam}
                    profiles={profiles}
                />
            </Grid>
        </Grid>
    );
};
