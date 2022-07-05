import React, { FunctionComponent } from 'react';
import { Box, Paper } from '@material-ui/core';
import { useDispatch } from 'react-redux';

import {
    // @ts-ignore
    Table,
} from 'bluesquare-components';

import { AssignmentsApi, AssignmentParams } from '../types/assigment';
import { OrgUnitShape, OrgUnitMarker } from '../types/locations';
import { useColumns } from '../configs/AssignmentsListTabColumns';
import { DropdownTeamsOptions, SubTeam, User } from '../types/team';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { Profile } from '../../../utils/usersUtils';

import { baseUrls } from '../../../constants/urls';
import { redirectTo } from '../../../routing/actions';

type Order = {
    id: string;
    desc: boolean;
};

type Orders = Array<Order>;

const getOrderArray = (orders: string | undefined): Orders => {
    if (!orders)
        return [
            {
                id: 'name',
                desc: false,
            },
        ];
    return orders.split(',').map(stringValue => ({
        id: stringValue.replace('-', ''),
        desc: stringValue.indexOf('-') !== -1,
    }));
};

type Props = {
    orgUnits: Array<OrgUnitShape | OrgUnitMarker | OrgUnit>;
    assignments: AssignmentsApi;
    isFetchingOrgUnits: boolean;
    params: AssignmentParams;
    handleSaveAssignment: (
        // eslint-disable-next-line no-unused-vars
        selectedOrgUnit: OrgUnitShape | OrgUnitMarker,
    ) => void;
    teams: DropdownTeamsOptions[];
    profiles: Profile[];
    selectedItem: SubTeam | User | undefined;
};

const baseUrl = baseUrls.assignments;
export const AssignmentsListTab: FunctionComponent<Props> = ({
    orgUnits,
    isFetchingOrgUnits,
    handleSaveAssignment,
    assignments,
    teams,
    profiles,
    selectedItem,
    params,
}: Props) => {
    const columns = useColumns({ orgUnits, assignments, teams, profiles });
    const dispatch = useDispatch();
    return (
        <Paper>
            <Box maxHeight="70vh" overflow="auto">
                <Table
                    data={orgUnits}
                    showPagination={false}
                    defaultSorted={getOrderArray(params.order)}
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
                    params={{ order: params.order }}
                    onRowClick={(row, event) => {
                        if (!event.target.href) {
                            handleSaveAssignment(row);
                        }
                    }}
                    onTableParamsChange={p => {
                        const newParams = {
                            ...params,
                            order: p.order,
                        };
                        dispatch(redirectTo(baseUrl, newParams));
                    }}
                />
            </Box>
        </Paper>
    );
};
