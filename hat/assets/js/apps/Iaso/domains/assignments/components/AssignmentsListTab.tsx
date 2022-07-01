import React, { FunctionComponent } from 'react';
import { Box, Paper } from '@material-ui/core';

import {
    // @ts-ignore
    Table,
} from 'bluesquare-components';

import { OrgUnitShape, OrgUnitMarker } from '../types/locations';
import { useColumns } from '../configs/AssignmentsListTabColumns';

type Props = {
    orgUnits: Array<OrgUnitShape | OrgUnitMarker>;
    isFetchingOrgUnits: boolean;
};

export const AssignmentsListTab: FunctionComponent<Props> = ({
    orgUnits,
    isFetchingOrgUnits,
}: Props) => {
    const columns = useColumns({ orgUnits });
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
                    }}
                />
            </Box>
        </Paper>
    );
};
