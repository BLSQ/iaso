import React, { FunctionComponent } from 'react';
import { Paper, Box } from '@mui/material';

import {
    // @ts-ignore
    Table,
} from 'bluesquare-components';

import { AssignmentsApi } from '../types/assigment';
import { Team, DropdownTeamsOptions, SubTeam, User } from '../types/team';

import { Profile } from '../../../utils/usersUtils';

import { useColumns } from '../configs/AssignmentsMapTabColumns';

import { AssignmentUnit } from '../types/locations';
import { getStickyTableHeadStyles } from '../../../styles/utils';

type Props = {
    data: SubTeam[] | User[];
    assignments: AssignmentsApi;
    currentTeam: Team | undefined;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    // eslint-disable-next-line no-unused-vars
    setItemColor: (color: string, teamId: number) => void;
    selectedItem: SubTeam | User | undefined;
    // eslint-disable-next-line no-unused-vars
    setSelectedItem: (newSelectedTeam: SubTeam) => void;
    orgUnits: Array<AssignmentUnit>;
    isLoadingAssignments: boolean;
};

export const Sidebar: FunctionComponent<Props> = ({
    data,
    assignments,
    teams,
    profiles,
    setItemColor,
    currentTeam,
    selectedItem,
    setSelectedItem,
    orgUnits,
    isLoadingAssignments,
}) => {
    const columns = useColumns({
        assignments,
        teams,
        profiles,
        setItemColor,
        selectedItem,
        setSelectedItem,
        currentTeam,
        orgUnits,
        isLoadingAssignments,
    });
    return (
        <Paper>
            <Box sx={getStickyTableHeadStyles('70vh')}>
                {/* @ts-ignore */}
                <Table
                    data={data}
                    elevation={0}
                    showPagination={false}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    countOnTop={false}
                    marginTop={false}
                    marginBottom={false}
                    columns={columns}
                    count={currentTeam?.sub_teams_details?.length ?? 0}
                    extraProps={{
                        // adding this will force table to
                        // re render while selecting a team, changing team color, changing assignments
                        selectedItemId: selectedItem?.id,
                        teams,
                        profiles,
                        assignments,
                        loading: !currentTeam,
                        orgUnits,
                    }}
                />
            </Box>
        </Paper>
    );
};
