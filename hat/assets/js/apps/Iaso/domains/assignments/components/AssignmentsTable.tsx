import React, { FunctionComponent } from 'react';
import { Box, Paper } from '@mui/material';
import { Pagination, useRedirectToReplace } from 'bluesquare-components';
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
    const redirectToReplace = useRedirectToReplace();
    const handleTableParamsChange = (key: string, value: any) => {
        redirectToReplace(baseUrls.assignments, {
            ...params,
            [key]: value,
        });
    };
    return (
        <Paper sx={{ height: defaultHeight }}>
            <Box
                sx={{
                    height: `calc(${defaultHeight} - 70px)`,
                    overflow: 'auto',
                    borderTop: theme =>
                        // @ts-ignore
                        `1px solid ${theme.palette.ligthGray.border}`,

                    '& .MuiSpeedDial-root': {
                        display: 'none',
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
                    countOnTop={false}
                    showPagination={false}
                    extraProps={{
                        defaultPageSize: data?.limit ?? tableDefaults.limit,
                        loading: isLoading,
                    }}
                    elevation={0}
                />
            </Box>
            {!isLoading && data && (
                <Pagination
                    count={data?.count ?? 0}
                    pageIndex={
                        (params.page
                            ? parseInt(params.page, 10)
                            : tableDefaults.page) - 1
                    }
                    rowsPerPage={data?.limit ?? tableDefaults.limit}
                    pages={data?.pages ?? 0}
                    onTableParamsChange={handleTableParamsChange}
                    countOnTop={false}
                />
            )}
        </Paper>
    );
};
