import React, { useState, useCallback } from 'react';
import {
    Typography,
    TableContainer,
    Table as MuiTable,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TablePagination,
    Tooltip,
    Box,
    Paper,
} from '@material-ui/core';
import { array, bool } from 'prop-types';
import { useSafeIntl } from 'bluesquare-components';
import CheckIcon from '@material-ui/icons/Check';
import MESSAGES from '../../constants/messages';
import { useStyles } from '../../styles/theme';

const makeTableText = text => {
    return (
        <Tooltip placement="bottom" title={text ?? 'no text'}>
            <Typography
                variant="body2"
                style={{
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {text}
            </Typography>
        </Tooltip>
    );
};

const sortbyDistrictNameAsc = (a, b) =>
    a.name.localeCompare(b.name, undefined, {
        sensitivity: 'accent',
    });

const sortbyDistrictNameDesc = (a, b) =>
    b.name.localeCompare(a.name, undefined, {
        sensitivity: 'accent',
    });

// Assuming status is either a number, or can be resolved to one by parseInt
const sortbyStatusAsc = (a, b) =>
    parseInt(a.status, 10) > parseInt(b.status, 10);
const sortbyStatusDesc = (a, b) =>
    parseInt(a.status, 10) < parseInt(b.status, 10);

const sortByFoundAsc = (a, b) => {
    const valueA = a.district ? 1 : 0;
    const valueB = b.district ? 1 : 0;
    return valueA > valueB;
};
const sortByFoundDesc = (a, b) => {
    const valueA = a.district ? 1 : 0;
    const valueB = b.district ? 1 : 0;
    return valueA < valueB;
};

export const LqasImTable = ({ data, marginTop }) => {
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

    const sortDataForTable = useCallback(() => {
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

    const dataForTable = sortDataForTable();

    const determineStatusColor = status => {
        if (parseInt(status, 10) === 1) return 'green';
        if (parseInt(status, 10) === 2) return 'orange';
        if (parseInt(status, 10) === 3) return 'red';
        throw new Error(
            `Expected to status value to be parsed to int value of 1,2 or 3, got ${parseInt(
                status,
                10,
            )}`,
        );
    };

    return (
        <Box mt={marginTop ? 8 : 0} mb={4}>
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
                                    return (
                                        <TableRow
                                            key={
                                                `${district.district}${i}` ??
                                                `${district.name}${i}`
                                            }
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
                                                {makeTableText(district.name)}
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
                                                    cursor: 'pointer',
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
                                                    cursor: 'pointer',
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
                                                    cursor: 'pointer',
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
};
LqasImTable.defaultProps = {
    data: [],
    marginTop: true,
};
