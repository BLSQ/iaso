import React, { FunctionComponent } from 'react';
import { Paper, Box } from '@material-ui/core';

import {
    // @ts-ignore
    Table,
} from 'bluesquare-components';

import { AssignmentsMapSelectors } from './AssignmentsMapSelectors';

import { AssignmentsApi, AssignmentParams } from '../types/assigment';
import { Team, DropdownTeamsOptions, SubTeam, User } from '../types/team';
import { DropdownOptions } from '../../../types/utils';

import { Profile } from '../../../utils/usersUtils';

import { useColumns } from '../configs/AssignmentsMapTabColumns';

type Props = {
    data: SubTeam[] | User[];
    assignments: AssignmentsApi;
    currentTeam: Team | undefined;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    // eslint-disable-next-line no-unused-vars
    setItemColor: (color: string, teamId: number) => void;
    params: AssignmentParams;
    orgunitTypes: Array<DropdownOptions<string>>;
    isFetchingOrgUnitTypes: boolean;
    selectedItem: SubTeam | User | undefined;
    // eslint-disable-next-line no-unused-vars
    setSelectedItem: (newSelectedTeam: SubTeam) => void;
};

export const Sidebar: FunctionComponent<Props> = ({
    data,
    assignments,
    teams,
    profiles,
    setItemColor,
    params,
    orgunitTypes,
    isFetchingOrgUnitTypes,
    currentTeam,
    selectedItem,
    setSelectedItem,
}) => {
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
        <Paper>
            <Box maxHeight="70vh" overflow="auto">
                <Table
                    data={data}
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
    );
};
