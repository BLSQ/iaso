import React, { FunctionComponent } from 'react';
import { Box, Paper } from '@material-ui/core';

import {
    // @ts-ignore
    Table,
} from 'bluesquare-components';

import { AssignmentsApi } from '../types/assigment';
import { OrgUnitShape, OrgUnitMarker } from '../types/locations';
import { useColumns } from '../configs/AssignmentsListTabColumns';
import { DropdownTeamsOptions, SubTeam, User } from '../types/team';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { Profile } from '../../../utils/usersUtils';

type Props = {
    orgUnits: Array<OrgUnitShape | OrgUnitMarker | OrgUnit>;
    assignments: AssignmentsApi;
    isFetchingOrgUnits: boolean;
    handleSaveAssignment: (
        // eslint-disable-next-line no-unused-vars
        selectedOrgUnit: OrgUnitShape | OrgUnitMarker,
    ) => void;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    selectedItem: SubTeam | User | undefined;
};

export const AssignmentsListTab: FunctionComponent<Props> = ({
    orgUnits,
    isFetchingOrgUnits,
    handleSaveAssignment,
    assignments,
    teams,
    profiles,
    selectedItem,
}: Props) => {
    const columns = useColumns({ orgUnits, assignments, teams, profiles });
    return (
        <Paper>
            <Box maxHeight="70vh" overflow="auto">
                <Table
                    data={orgUnits}
                    showPagination={false}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    countOnTop={false}
                    marginTop={false}
                    marginBottom={false}
                    columns={columns}
                    count={orgUnits?.length ?? 0}
                    extraProps={{
                        orgUnits,
                        loading: isFetchingOrgUnits,
                        teams,
                        profiles,
                        assignments,
                        selectedItem,
                    }}
                    onRowClick={row => handleSaveAssignment(row)}
                />
            </Box>
        </Paper>
    );
};
