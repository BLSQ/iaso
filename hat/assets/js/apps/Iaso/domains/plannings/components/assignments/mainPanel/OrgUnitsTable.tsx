import React, {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import Box from '@mui/material/Box/Box';
import Checkbox from '@mui/material/Checkbox/Checkbox';
import Table from '@mui/material/Table/Table';
import TableBody from '@mui/material/TableBody/TableBody';
import TableCell from '@mui/material/TableCell/TableCell';
import TableContainer from '@mui/material/TableContainer/TableContainer';
import TableHead from '@mui/material/TableHead/TableHead';
import TableRow from '@mui/material/TableRow/TableRow';
import Typography from '@mui/material/Typography/Typography';
import { LoadingSpinner, Pagination, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import MESSAGES from '../../../messages';
import { ClearAssignmentsBelowDialog } from '../assign/ClearAssignmentsBelowDialog';
import { useAssignableOrgUnits } from '../assign/useAssignableOrgUnits';
import { useAssignOnClick } from '../assign/useAssignOnClick';
import { useListSelection } from '../assign/useListSelection';
import { OrgUnitTableRow } from './OrgUnitTableRow';
import { SelectionBar } from './SelectionBar';
import { OrgUnitRow } from './types';
import { useLevelOrgUnitRows } from './useLevelOrgUnitRows';
import { getAssignmentProgress } from './utils';

const styles = {
    container: {
        position: 'relative',
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
    checkboxCell: {
        width: 0,
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

const getEmptyMessage = (hasLevelRows: boolean, isOnlyAssignable: boolean) => {
    if (!hasLevelRows) return MESSAGES.noOrgUnitsToAssign;
    return isOnlyAssignable
        ? MESSAGES.noOrgUnitMatchesFilter
        : MESSAGES.allOrgUnitsAssigned;
};

// Same org units as the map: the level the selected team's members work on.
export const OrgUnitsTable: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { rows: levelRows, isFetching } = useLevelOrgUnitRows();
    const { openTeam, onlyUnassigned, onlyAssignable, focusOrgUnitId } =
        useAssignmentsParams();
    const { isAssignMode } = useAssignmentsContext();
    const focusedOrgUnitId = focusOrgUnitId
        ? Number(focusOrgUnitId)
        : undefined;
    const {
        assignableOrgUnitIds,
        toggleAssignment,
        pendingChange,
        cancelPendingChange,
    } = useAssignOnClick();
    const isRowClickable = (row: OrgUnitRow) =>
        isAssignMode ? assignableOrgUnitIds.has(row.id) : Boolean(row.teamId);
    const handleRowClick = useCallback(
        (row: OrgUnitRow) => {
            if (isAssignMode) {
                toggleAssignment(row.id);
            } else if (row.teamId) {
                openTeam(row.teamId);
            }
        },
        [isAssignMode, toggleAssignment, openTeam],
    );
    const { assignableOrgUnitIds: assignableByTeam } = useAssignableOrgUnits();
    const isOnlyAssignable = isAssignMode && onlyAssignable;
    const rows = useMemo(
        () =>
            levelRows.filter(
                row =>
                    (!onlyUnassigned || !row.assignee) &&
                    (!isOnlyAssignable || assignableByTeam.has(row.id)),
            ),
        [levelRows, onlyUnassigned, isOnlyAssignable, assignableByTeam],
    );
    const selection = useListSelection(rows);
    const progress = useMemo(
        () => getAssignmentProgress(levelRows, assignableByTeam),
        [levelRows, assignableByTeam],
    );

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
    useEffect(() => setPage(0), [onlyUnassigned, isOnlyAssignable]);
    // Once per found org unit, when its rows are there: paging stays free afterwards.
    const shownFocusId = useRef<number>();
    useEffect(() => {
        if (!focusedOrgUnitId || shownFocusId.current === focusedOrgUnitId)
            return;
        const index = rows.findIndex(row => row.id === focusedOrgUnitId);
        if (index === -1) return;
        shownFocusId.current = focusedOrgUnitId;
        setPage(Math.floor(index / rowsPerPage));
    }, [focusedOrgUnitId, rows, rowsPerPage]);
    // Selecting a team on another level can leave fewer pages than the current one.
    const lastPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
    const currentPage = Math.min(page, lastPage);
    const pageRows = rows.slice(
        currentPage * rowsPerPage,
        (currentPage + 1) * rowsPerPage,
    );
    const selectablePageRows = pageRows.filter(selection.isSelectable);
    const selectedOnPageCount = selectablePageRows.filter(row =>
        selection.selectedIds.has(row.id),
    ).length;
    const isPageSelected =
        selectablePageRows.length > 0 &&
        selectedOnPageCount === selectablePageRows.length;
    const { select, unselect } = selection;
    const togglePage = useCallback(
        () =>
            isPageSelected
                ? unselect(selectablePageRows)
                : select(selectablePageRows),
        [isPageSelected, select, unselect, selectablePageRows],
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
            {isFetching && <LoadingSpinner absolute fixed={false} />}
            {isAssignMode && (
                <SelectionBar selection={selection} progress={progress} />
            )}
            <TableContainer sx={styles.tableContainer}>
                <Table stickyHeader sx={styles.table}>
                    <TableHead>
                        <TableRow>
                            {isAssignMode && (
                                <TableCell
                                    padding="checkbox"
                                    sx={{
                                        ...styles.headerCell,
                                        ...styles.checkboxCell,
                                    }}
                                >
                                    <Checkbox
                                        size="small"
                                        checked={isPageSelected}
                                        indeterminate={
                                            selectedOnPageCount > 0 &&
                                            !isPageSelected
                                        }
                                        disabled={!selectablePageRows.length}
                                        onChange={togglePage}
                                        inputProps={{
                                            'aria-label': formatMessage(
                                                MESSAGES.selectAll,
                                            ),
                                        }}
                                    />
                                </TableCell>
                            )}
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
                                isFocused={row.id === focusedOrgUnitId}
                                isClickable={isRowClickable(row)}
                                onClick={handleRowClick}
                                selection={
                                    isAssignMode
                                        ? {
                                              isSelectable:
                                                  selection.isSelectable(row),
                                              isSelected:
                                                  selection.selectedIds.has(
                                                      row.id,
                                                  ),
                                              onToggle: selection.toggle,
                                          }
                                        : undefined
                                }
                            />
                        ))}
                        {rows.length === 0 && !isFetching && (
                            <TableRow>
                                <TableCell colSpan={isAssignMode ? 5 : 4}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {formatMessage(
                                            getEmptyMessage(
                                                levelRows.length > 0,
                                                isOnlyAssignable,
                                            ),
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
            <ClearAssignmentsBelowDialog
                pendingChange={pendingChange}
                onClose={cancelPendingChange}
            />
        </Box>
    );
};
