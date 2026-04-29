import React, { FunctionComponent } from 'react';
import { Box, Paper } from '@mui/material';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import {
    useGetPlanningOrgUnitsChildrenPaginated,
    tableDefaults,
} from 'Iaso/domains/teams/hooks/requests/useGetPlanningOrgUnits';
import { Planning } from '../../plannings/types';
import { defaultHeight } from '../constants/ui';
import { useGetColumns } from '../hooks/useGetColumns';
import { AssignmentParams } from '../types/assigment';

type Props = {
    planning?: Planning;
    params: AssignmentParams;
};

export const AssignmentsTable: FunctionComponent<Props> = ({
    planning,
    params,
}) => {
    const { data, isLoading } = useGetPlanningOrgUnitsChildrenPaginated(
        planning?.id,
        params,
    );
    const columns = useGetColumns();

    const tableScrollMaxHeight = `calc(${defaultHeight} - 70px)`;
    return (
        <Paper sx={{ height: defaultHeight }}>
            <Box
                sx={{
                    borderTop: theme =>
                        // @ts-ignore
                        `1px solid ${theme.palette.ligthGray.border}`,
                    '& .MuiSpeedDial-root': {
                        display: 'none',
                    },
                    '& .MuiTableContainer-root': {
                        maxHeight: tableScrollMaxHeight,
                        overflowY: 'auto',
                        overflowX: 'auto',
                        '& .MuiTableHead-root th': {
                            top: 0,
                            position: 'sticky !important',
                        },
                    },
                }}
            >
                <TableWithDeepLink
                    baseUrl={baseUrls.assignments}
                    params={params}
                    marginBottom={false}
                    marginTop={false}
                    columns={columns}
                    defaultSorted={[{ id: 'ended_at', desc: true }]}
                    data={data?.results ?? []}
                    count={data?.count ?? 0}
                    pages={data?.pages ?? 0}
                    elevation={0}
                    countOnTop={false}
                    extraProps={{
                        defaultPageSize: data?.limit ?? tableDefaults.limit,
                        loading: isLoading,
                    }}
                />
            </Box>
        </Paper>
    );
};
