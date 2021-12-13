import React, { useState, useCallback, useMemo } from 'react';
import {
    TableContainer,
    Table as MuiTable,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TablePagination,
    Box,
    Paper,
} from '@material-ui/core';
import { array, bool, string } from 'prop-types';
import { useSafeIntl } from 'bluesquare-components';
import CheckIcon from '@material-ui/icons/Check';
import MESSAGES from '../../constants/messages';
import { useStyles } from '../../styles/theme';
import {
    makeTableText,
    sortbyDistrictNameAsc,
    sortbyDistrictNameDesc,
    sortbyStatusAsc,
    sortbyStatusDesc,
    sortByFoundAsc,
    sortByFoundDesc,
} from './tableUtils';

export const LqasImTable = ({ data, marginTop, tableKey }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [sortBy, setSortBy] = useState('asc');
    const [sortFocus, setSortFocus] = useState('DISTRICT');

    const handleSort = useCallback(
        orgUnitType => {
            if (sortFocus !== orgUnitType) {
                setSortFocus(orgUnitType);
            } else if (sortBy === 'asc') {
                setSortBy('desc');
            } else {
                setSortBy('asc');
            }
        },
        [sortBy, sortFocus],
    );

    const handleChangePage = (_event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = event => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const dataForTable = useMemo(() => {
        if (sortFocus === 'DISTRICT' && sortBy === 'asc') {
            return data.sort(sortbyDistrictNameAsc);
        }
        if (sortFocus === 'DISTRICT' && sortBy === 'desc') {
            return data.sort(sortbyDistrictNameDesc);
        }
        if (sortFocus === 'STATUS' && sortBy === 'asc') {
            return data.sort(sortbyStatusAsc);
        }
        if (sortFocus === 'STATUS' && sortBy === 'desc') {
            return data.sort(sortbyStatusDesc);
        }
        if (sortFocus === 'FOUND' && sortBy === 'asc') {
            return data.sort(sortByFoundAsc);
        }
        if (sortFocus === 'FOUND' && sortBy === 'desc') {
            return data.sort(sortByFoundDesc);
        }
        console.warn(
            `Sort error, there must be a wrong parameter. Received: ${sortBy}, ${sortFocus}. Expected a combination of asc|desc and DISTRICT|STATUS|FOUND`,
        );
        return null;
    }, [sortBy, sortFocus, data]);

    const determineStatusColor = status => {
        if (parseInt(status, 10) === 1) return 'green';
        if (parseInt(status, 10) === 2) return '#FFD835';
        if (parseInt(status, 10) === 3) return 'red';
        throw new Error(
            `Expected to status value to be parsed to int value of 1,2 or 3, got ${parseInt(
                status,
                10,
            )}`,
        );
    };
    return (
        <Box mt={marginTop ? 4 : 0} mb={4}>
            <Paper elevation={3}>
                <TableContainer>
                    <MuiTable stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    onClick={() => handleSort('DISTRICT')}
                                    variant="head"
                                    className={classes.sortableTableHeadCell}
                                >
                                    {formatMessage(MESSAGES.district)}
                                </TableCell>
                                <TableCell
                                    variant="head"
                                    className={classes.tableHeadCell}
                                >
                                    {formatMessage(MESSAGES.childrenMarked)}
                                </TableCell>
                                <TableCell
                                    variant="head"
                                    className={classes.tableHeadCell}
                                >
                                    {formatMessage(MESSAGES.childrenChecked)}
                                </TableCell>
                                <TableCell
                                    onClick={() => handleSort('STATUS')}
                                    variant="head"
                                    className={classes.sortableTableHeadCell}
                                >
                                    {formatMessage(MESSAGES.status)}
                                </TableCell>
                                <TableCell
                                    onClick={() => handleSort('FOUND')}
                                    variant="head"
                                    className={classes.sortableTableHeadCell}
                                >
                                    {formatMessage(MESSAGES.districtFound)}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {dataForTable
                                ?.slice(
                                    page * rowsPerPage,
                                    page * rowsPerPage + rowsPerPage,
                                )
                                .map((district, i) => {
                                    const statusColor = determineStatusColor(
                                        district.status,
                                    );
                                    if (district) {
                                        return (
                                            <TableRow
                                                key={`${tableKey}${district.name}${i}`}
                                                className={
                                                    i % 2 > 0
                                                        ? ''
                                                        : classes.districtListRow
                                                }
                                            >
                                                <TableCell
                                                    style={{
                                                        cursor: 'default',
                                                    }}
                                                    align="center"
                                                    className={
                                                        classes.lqasImTableCell
                                                    }
                                                >
                                                    {makeTableText(
                                                        district.name,
                                                    )}
                                                </TableCell>
                                                <TableCell
                                                    style={{
                                                        cursor: 'default',
                                                    }}
                                                    align="center"
                                                    className={
                                                        classes.lqasImTableCell
                                                    }
                                                >
                                                    {makeTableText(
                                                        district.total_child_fmd,
                                                    )}
                                                </TableCell>
                                                <TableCell
                                                    style={{
                                                        cursor: 'default',
                                                    }}
                                                    align="center"
                                                    className={
                                                        classes.lqasImTableCell
                                                    }
                                                >
                                                    {makeTableText(
                                                        district.total_child_checked,
                                                    )}
                                                </TableCell>
                                                <TableCell
                                                    style={{
                                                        cursor: 'default',
                                                        color: statusColor,
                                                    }}
                                                    align="center"
                                                    className={
                                                        classes.lqasImTableCell
                                                    }
                                                >
                                                    {makeTableText(
                                                        formatMessage(
                                                            MESSAGES[
                                                                district.status
                                                            ],
                                                        ),
                                                    )}
                                                </TableCell>
                                                <TableCell
                                                    style={{
                                                        cursor: 'default',
                                                    }}
                                                    align="center"
                                                    className={
                                                        classes.lqasImTableCell
                                                    }
                                                >
                                                    {district.district && (
                                                        <CheckIcon />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }
                                    return null;
                                })}
                        </TableBody>
                    </MuiTable>
                </TableContainer>
                <TablePagination
                    className={classes.tablePagination}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={dataForTable?.length ?? 0}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    labelRowsPerPage="Rows"
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </Box>
    );
};

LqasImTable.propTypes = {
    data: array,
    marginTop: bool,
    tableKey: string.isRequired,
};
LqasImTable.defaultProps = {
    data: [],
    marginTop: true,
};
