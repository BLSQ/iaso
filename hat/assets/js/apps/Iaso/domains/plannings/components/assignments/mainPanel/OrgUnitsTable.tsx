import React, { FC, useCallback, useMemo, useState } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Pagination, useSafeIntl } from 'bluesquare-components';
import { TeamType } from 'Iaso/domains/teams/constants';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import MESSAGES from '../../../messages';
import { OrgUnitTableRow } from './OrgUnitTableRow';
import { useAssignments } from './useAssignments';
import {
    getAssigneeByOrgUnitId,
    getLevelOrgUnitRows,
    getTeamIdByOrgUnitId,
} from './utils';

const styles = {
    container: {
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
    },
    tableContainer: {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
    },
    // Lines the first and last columns up with the tab labels above.
    table: {
        '& .MuiTableCell-root:first-of-type': { pl: 4 },
        '& .MuiTableCell-root:last-of-type': { pr: 4 },
    },
    headerCell: {
        fontWeight: 500,
        borderBottomWidth: 2,
    },
    nameColumn: { width: '30%' },
    parentColumn: { width: '22%' },
    assignmentColumn: { width: '28%' },
    pagination: {
        borderTop: 1,
        borderColor: 'divider',
    },
} satisfies SxStyles;

const DEFAULT_ROWS_PER_PAGE = 20;

// Same org units as the map: the level the selected team's members work on.
export const OrgUnitsTable: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { planning, tree, levelTree, selectedTeam, selectedLevel } =
        useAssignmentsContext();
    const { openTeam } = useAssignmentsParams();
    const { data: assignments } = useAssignments(`${planning.id}`);
    const rows = useMemo(
        () =>
            getLevelOrgUnitRows({
                levelTree,
                level: selectedLevel + 1,
                assigneeByOrgUnitId: getAssigneeByOrgUnitId(
                    tree,
                    assignments ?? [],
                ),
                teamIdByOrgUnitId: getTeamIdByOrgUnitId(assignments ?? []),
                showPoints: selectedTeam.type === TeamType.TEAM_OF_USERS,
            }),
        [levelTree, selectedLevel, selectedTeam.type, tree, assignments],
    );

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
    // Selecting a team on another level can leave fewer pages than the current one.
    const lastPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
    const currentPage = Math.min(page, lastPage);
    const pageRows = rows.slice(
        currentPage * rowsPerPage,
        (currentPage + 1) * rowsPerPage,
    );

    // The pagination counts pages from 1.
    const handleTableParamsChange = useCallback(
        (key: string, value: number | string) => {
            if (key === 'page') setPage(Number(value) - 1);
            if (key === 'pageSize') {
                setRowsPerPage(Number(value));
                setPage(0);
            }
        },
        [],
    );

    return (
        <Box sx={styles.container}>
            <TableContainer sx={styles.tableContainer}>
                <Table stickyHeader sx={styles.table}>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    ...styles.headerCell,
                                    ...styles.nameColumn,
                                }}
                            >
                                {formatMessage(MESSAGES.name)}
                            </TableCell>
                            <TableCell
                                sx={{
                                    ...styles.headerCell,
                                    ...styles.parentColumn,
                                }}
                            >
                                {formatMessage(MESSAGES.parent)}
                            </TableCell>
                            <TableCell
                                sx={{
                                    ...styles.headerCell,
                                    ...styles.assignmentColumn,
                                }}
                            >
                                {formatMessage(MESSAGES.assignment)}
                            </TableCell>
                            <TableCell sx={styles.headerCell}>
                                {formatMessage(MESSAGES.below)}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pageRows.map(row => (
                            <OrgUnitTableRow
                                key={row.id}
                                row={row}
                                onOpenTeam={openTeam}
                            />
                        ))}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {formatMessage(
                                            MESSAGES.noOrgUnitsToAssign,
                                        )}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={styles.pagination}>
                <Pagination
                    count={rows.length}
                    rowsPerPage={rowsPerPage}
                    pageIndex={currentPage}
                    pages={lastPage + 1}
                    onTableParamsChange={handleTableParamsChange}
                    countOnTop={false}
                    selectCount={0}
                />
            </Box>
        </Box>
    );
};
