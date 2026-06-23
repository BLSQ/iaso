import React, { FunctionComponent, useCallback } from 'react';
import { Box, Paper } from '@mui/material';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import {
    useGetPlanningOrgUnitsChildrenPaginated,
    tableDefaults,
} from 'Iaso/domains/teams/hooks/requests/useGetPlanningOrgUnits';
import { getStickyTableHeadStyles } from 'Iaso/styles/utils';
import { SxStyles } from 'Iaso/types/general';
import { PaginatedPlanningOrgUnit } from '../../../plannings/types';
import { defaultHeight } from '../../constants/ui';
import { useAssignmentsContext } from '../../contexts/AssignmentsContext';
import { useGetColumns } from '../../hooks/useGetColumns';
import { AssignmentParams } from '../../types/assigment';

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
        ...getStickyTableHeadStyles(tableScrollMaxHeight),
    },
};

type Props = {
    params: AssignmentParams;
};

export const AssignmentsTable: FunctionComponent<Props> = ({ params }) => {
    const {
        canAssign,
        handleSaveAssignment,
        isSaving,
        selectedUser,
        selectedTeam,
    } = useAssignmentsContext();

    const { data, isLoading } = useGetPlanningOrgUnitsChildrenPaginated(
        params.planningId,
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
                    defaultSorted={[{ id: 'name', desc: false }]}
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
