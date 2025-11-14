import React, { FunctionComponent } from 'react';
import { Box, Paper } from '@mui/material';

import { Table } from 'bluesquare-components';

import { getStickyTableHeadStyles } from '../../../styles/utils';
import { Profile } from '../../../utils/usersUtils';
import {
    DropdownTeamsOptions,
    SubTeam,
    Team,
    User,
} from '../../teams/types/team';
import { useColumns } from '../configs/AssignmentsMapTabColumns';
import { AssignmentsApi } from '../types/assigment';
import { AssignmentUnit } from '../types/locations';

type Props = {
    data: SubTeam[] | User[];
    assignments: AssignmentsApi;
    currentTeam: Team | undefined;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    setItemColor: (color: string, teamId: number) => void;
    selectedItem: SubTeam | User | undefined;
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
    });
    return (
        <Paper>
            <Box sx={getStickyTableHeadStyles('70vh')}>
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
                        isLoadingAssignments,
                    }}
                />
            </Box>
        </Paper>
    );
};
