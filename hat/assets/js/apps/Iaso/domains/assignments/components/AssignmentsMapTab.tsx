import React, { FunctionComponent, useState, useEffect } from 'react';
import { Grid, Paper, Box } from '@material-ui/core';
import { useTheme, Theme } from '@material-ui/core/styles';

import {
    // @ts-ignore
    Table,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';
import { getOrgUnitAssignation } from '../utils';

import { AssignmentsMap } from './AssignmentsMap';
import { AssignmentsMapSelectors } from './AssignmentsMapSelectors';
import { ParentDialog } from './ParentDialog';

import {
    AssignmentsApi,
    SaveAssignmentQuery,
    AssignmentParams,
} from '../types/assigment';
import { Planning } from '../types/planning';
import { Team, DropdownTeamsOptions, SubTeam, User } from '../types/team';
import { OrgUnitMarker, OrgUnitShape } from '../types/locations';
import { DropdownOptions } from '../../../types/utils';
import { OrgUnit } from '../../orgUnits/types/orgUnit';

import { Profile } from '../../../utils/usersUtils';

import { useGetOrgUnitLocations } from '../hooks/requests/useGetOrgUnitLocations';
import { useGetOrgUnitParentLocations } from '../hooks/requests/useGetOrgUnitParentLocations';

import { getColumns } from '../configs/AssignmentsMapTabColumns';

type Props = {
    assignments: AssignmentsApi;
    allAssignments: AssignmentsApi;
    planning: Planning | undefined;
    currentTeam: Team | undefined;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    // eslint-disable-next-line no-unused-vars
    setItemColor: (color: string, teamId: number) => void;
    // eslint-disable-next-line no-unused-vars
    saveAssignment: (params: SaveAssignmentQuery) => void;
    baseOrgunitType: string | undefined;
    params: AssignmentParams;
    orgunitTypes: Array<DropdownOptions<string>>;
    isFetchingOrgUnitTypes: boolean;
    // eslint-disable-next-line no-unused-vars
    setParentSelected: (orgUnit: OrgUnitShape | undefined) => void;
    childrenOrgunits: OrgUnit[];
    parentSelected: OrgUnitShape | undefined;
};

export const AssignmentsMapTab: FunctionComponent<Props> = ({
    assignments,
    allAssignments,
    planning,
    currentTeam,
    teams,
    profiles,
    setItemColor,
    saveAssignment,
    baseOrgunitType,
    params,
    orgunitTypes,
    isFetchingOrgUnitTypes,
    setParentSelected,
    childrenOrgunits,
    parentSelected,
}) => {
    const { formatMessage } = useSafeIntl();
    const { parentPicking, parentOrgunitType } = params;
    const theme: Theme = useTheme();

    const [selectedItem, setSelectedItem] = useState<
        SubTeam | User | undefined
    >();

    const handleClick = (selectedOrgUnit: OrgUnitShape | OrgUnitMarker) => {
        const { assignment, assignedTeam, assignedUser, emptyAssignment } =
            getOrgUnitAssignation(
                allAssignments,
                selectedOrgUnit,
                teams,
                profiles,
                currentTeam?.type,
            );
        if (planning && selectedItem) {
            let saveParams: SaveAssignmentQuery = {
                planning: planning.id,
                org_unit: selectedOrgUnit.id,
            };
            // TODO: make it better, copy paste for now...
            if (currentTeam?.type === 'TEAM_OF_TEAMS') {
                saveParams.team = selectedItem.id;
                let id = assignment?.id;
                if (!id && emptyAssignment) {
                    id = emptyAssignment.id;
                }
                if (id) {
                    if (assignedTeam) {
                        if (selectedItem.id !== assignedTeam.original.id) {
                            // update assignment
                            saveParams = {
                                id,
                                ...saveParams,
                            };
                        } else {
                            // fake delete assignment, remove team / user
                            saveParams = {
                                ...saveParams,
                                team: null,
                                user: null,
                                id,
                            };
                        }
                    } else {
                        // update assignment after fake delete
                        saveParams = {
                            id,
                            ...saveParams,
                        };
                    }
                }
            }
            if (currentTeam?.type === 'TEAM_OF_USERS') {
                saveParams.user = selectedItem.id;
                let id = assignment?.id;
                if (!id && emptyAssignment) {
                    id = emptyAssignment.id;
                }
                if (id) {
                    if (assignedUser) {
                        if (selectedItem.id !== assignedUser.user_id) {
                            // update assignment
                            saveParams = {
                                id,
                                ...saveParams,
                            };
                        } else {
                            // fake delete assignment, remove team / user
                            saveParams = {
                                ...saveParams,
                                team: null,
                                user: null,
                                id,
                            };
                        }
                    } else {
                        // update assignment after fake delete
                        saveParams = {
                            id,
                            ...saveParams,
                        };
                    }
                }
            }
            saveAssignment(saveParams);
        }
    };

    useEffect(() => {
        if (planning && currentTeam) {
            if (currentTeam.type === 'TEAM_OF_USERS') {
                setSelectedItem(currentTeam.users_details[0]);
            }
            if (currentTeam.type === 'TEAM_OF_TEAMS') {
                setSelectedItem(currentTeam.sub_teams_details[0]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planning?.id, currentTeam?.id]);

    const data =
        currentTeam?.type === 'TEAM_OF_USERS'
            ? currentTeam.users_details
            : currentTeam?.sub_teams_details;

    const { data: locations, isFetching: isFetchingLocations } =
        useGetOrgUnitLocations({
            orgUnitParentId: planning?.org_unit,
            baseOrgunitType,
            assignments,
            allAssignments,
            teams,
            profiles,
            currentType: currentTeam?.type,
        });

    const { data: parentLocations, isFetching: isFetchingParentLocations } =
        useGetOrgUnitParentLocations({
            orgUnitParentId: planning?.org_unit,
            baseOrgunitType:
                parentPicking === 'true' ? parentOrgunitType : undefined,
        });

    return (
        <>
            <ParentDialog
                locations={locations}
                childrenOrgunits={childrenOrgunits || []}
                parentSelected={parentSelected}
                setParentSelected={setParentSelected}
                allAssignments={allAssignments}
                selectedItem={selectedItem}
                currentTeam={currentTeam}
                teams={teams}
                profiles={profiles}
            />
            <Grid container spacing={2}>
                <Grid item xs={5}>
                    <Paper>
                        <Box maxHeight="60vh" overflow="auto">
                            <Table
                                data={data || []}
                                showPagination={false}
                                defaultSorted={[{ id: 'name', desc: false }]}
                                countOnTop={false}
                                marginTop={false}
                                marginBottom={false}
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
                                count={
                                    currentTeam?.sub_teams_details?.length ?? 0
                                }
                                extraProps={{
                                    // adding this will force table to
                                    // re render while selecting a team, changing team color, changing assignments
                                    selectedItemId: selectedItem?.id,
                                    teams,
                                    profiles,
                                    assignments,
                                }}
                            />
                        </Box>
                        <Box px={2}>
                            <AssignmentsMapSelectors
                                params={params}
                                orgunitTypes={orgunitTypes}
                                isFetchingOrgUnitTypes={isFetchingOrgUnitTypes}
                            />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={7}>
                    <AssignmentsMap
                        locations={locations}
                        isFetchingLocations={isFetchingLocations}
                        handleClick={handleClick}
                        handleParentClick={setParentSelected}
                        parentLocations={parentLocations}
                        isFetchingParentLocations={isFetchingParentLocations}
                        teams={teams}
                    />
                </Grid>
            </Grid>
        </>
    );
};
