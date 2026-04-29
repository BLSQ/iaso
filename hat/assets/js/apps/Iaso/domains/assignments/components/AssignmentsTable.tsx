import React, { FunctionComponent, useCallback } from 'react';
import { Box, Paper } from '@mui/material';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import {
    useGetPlanningOrgUnitsChildrenPaginated,
    tableDefaults,
} from 'Iaso/domains/teams/hooks/requests/useGetPlanningOrgUnits';
import { SxStyles } from 'Iaso/types/general';
import { PaginatedPlanningOrgUnit, Planning } from '../../plannings/types';
import { SubTeam, User } from '../../teams/types/team';
import { defaultHeight } from '../constants/ui';
import { useGetColumns } from '../hooks/useGetColumns';
import { AssignmentParams } from '../types/assigment';

const tableScrollMaxHeight = `calc(${defaultHeight} - 70px)`;

const styles: SxStyles = {
    paper: {
        height: defaultHeight,
        elevation: 2,
    },
    tableContainer: {
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
    },
};

type Props = {
    planning?: Planning;
    params: AssignmentParams;
    canAssign: boolean;
    handleSaveAssignment: (orgUnitId: number) => void;
    isSaving: boolean;
    selectedUser?: User;
    selectedTeam?: SubTeam;
};

export const AssignmentsTable: FunctionComponent<Props> = ({
    planning,
    params,
    canAssign,
    handleSaveAssignment,
    isSaving,
    selectedUser,
    selectedTeam,
}) => {
    const { data, isLoading } = useGetPlanningOrgUnitsChildrenPaginated(
        planning?.id,
        params,
    );
    const columns = useGetColumns();
    const handleRowClick = useCallback(
        (row: PaginatedPlanningOrgUnit) => {
            handleSaveAssignment(row.id);
        },
        [handleSaveAssignment],
    );
    return (
        <Paper sx={styles.paper}>
            <Box sx={styles.tableContainer}>
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
                    onRowClick={canAssign ? handleRowClick : undefined}
                    extraProps={{
                        defaultPageSize: data?.limit ?? tableDefaults.limit,
                        loading: isLoading || isSaving,
                        canAssign,
                        selectedUser,
                        selectedTeam,
                    }}
                />
            </Box>
        </Paper>
    );
};
