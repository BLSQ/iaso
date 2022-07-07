import React, {
    FunctionComponent,
    useState,
    useEffect,
    useCallback,
} from 'react';
import { Grid, Paper, Box } from '@material-ui/core';

import {
    // @ts-ignore
    Table,
} from 'bluesquare-components';

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
import { getSaveParams } from '../utils';

import { useGetOrgUnitLocations } from '../hooks/requests/useGetOrgUnitLocations';
import { useGetOrgUnitParentLocations } from '../hooks/requests/useGetOrgUnitParentLocations';

import { useColumns } from '../configs/AssignmentsMapTabColumns';

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
    // eslint-disable-next-line no-unused-vars
    saveMultiAssignments: (params: SaveAssignmentQuery) => void;
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
    saveMultiAssignments,
    baseOrgunitType,
    params,
    orgunitTypes,
    isFetchingOrgUnitTypes,
    setParentSelected,
    childrenOrgunits,
    parentSelected,
}) => {
    const { parentPicking, parentOrgunitType } = params;

    const [selectedItem, setSelectedItem] = useState<
        SubTeam | User | undefined
    >();

    const handleSave = (selectedOrgUnit: OrgUnitShape | OrgUnitMarker) => {
        if (planning && selectedItem) {
            const saveParams = getSaveParams({
                allAssignments,
                selectedOrgUnit,
                teams,
                profiles,
                currentType: currentTeam?.type,
                selectedItem,
                planning,
            });
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

    const getOrgUnitParentIds = useCallback(() => {
        // change parent regarding the team selected
        // if no assignation use planning?.org_unit,
        // else use assignation
        let orgUnitParentIds: number[] = [];
        if (currentTeam) {
            const existingAssignmentsForTeamOrUser = allAssignments.filter(
                assignment => assignment.team === currentTeam.id,
            );
            if (existingAssignmentsForTeamOrUser) {
                orgUnitParentIds = existingAssignmentsForTeamOrUser.map(
                    assignment => assignment.org_unit,
                );
            }
        }
        if (planning?.org_unit && orgUnitParentIds.length === 0) {
            orgUnitParentIds = [planning?.org_unit];
        }
        return orgUnitParentIds;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTeam]);

    const { data: locations, isFetching: isFetchingLocations } =
        useGetOrgUnitLocations({
            orgUnitParentIds: getOrgUnitParentIds(),
            baseOrgunitType,
            assignments,
            allAssignments,
            teams,
            profiles,
            currentType: currentTeam?.type,
        });

    const { data: parentLocations, isFetching: isFetchingParentLocations } =
        useGetOrgUnitParentLocations({
            orgUnitParentIds: getOrgUnitParentIds(),
            baseOrgunitType:
                parentPicking === 'true' ? parentOrgunitType : undefined,
        });

    const columns = useColumns({
        assignments,
        teams,
        profiles,
        setItemColor,
        selectedItem,
        setSelectedItem,
        currentTeam,
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
                planning={planning}
                saveMultiAssignments={saveMultiAssignments}
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
                                columns={columns}
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
                        handleClick={handleSave}
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
