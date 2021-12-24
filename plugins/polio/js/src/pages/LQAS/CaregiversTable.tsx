/* eslint-disable react/require-default-props */
import React, { FunctionComponent, useState } from 'react';
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
import { useSafeIntl } from 'bluesquare-components';
import { ClassNameMap } from '@material-ui/core/styles/withStyles';
// import { makeTableText } from '../../components/LQAS-IM/tableUtils';
import MESSAGES from '../../constants/messages';
import { useStyles } from '../../styles/theme';
import { LqasImCampaignDataWithNameAndRegion } from './types';
import { caregiverSourceInfoKeys } from './constants';

type Props = {
    data: LqasImCampaignDataWithNameAndRegion[];
    marginTop?: boolean;
    tableKey: string;
};

export const CaregiversTable: FunctionComponent<Props> = ({
    data,
    marginTop = true,
    tableKey,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: ClassNameMap<any> = useStyles();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    // const [sortBy, setSortBy] = useState('asc');
    // const [sortFocus, setSortFocus] = useState('DISTRICT');

    // TODO modify sort function to sort translated messages
    const orderedSourceInfoKeys = caregiverSourceInfoKeys.sort((a, b) => {
        if (a === 'caregivers_informed') return 0;
        if (b === 'Others') return 0;
        return b.localeCompare(a, undefined, { sensitivity: 'accent' });
    });

    // const handleSort = useCallback(
    //     focus => {
    //         if (sortFocus !== focus) {
    //             setSortFocus(focus);
    //         } else if (sortBy === 'asc') {
    //             setSortBy('desc');
    //         } else {
    //             setSortBy('asc');
    //         }
    //     },
    //     [sortBy, sortFocus],
    // );

    const handleChangePage = (_event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = event => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box mt={marginTop ? 4 : 0} mb={4}>
            <Paper elevation={3}>
                <TableContainer>
                    <MuiTable stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    variant="head"
                                    className={classes.sortableTableHeadCell}
                                >
                                    {formatMessage(MESSAGES.region)}
                                </TableCell>
                                <TableCell
                                    variant="head"
                                    className={classes.sortableTableHeadCell}
                                >
                                    {formatMessage(MESSAGES.district)}
                                </TableCell>
                                {orderedSourceInfoKeys.map(
                                    (sourceInfoKey, i) => {
                                        return (
                                            <TableCell
                                                key={`${tableKey}-head-${sourceInfoKey}-${i}`}
                                                variant="head"
                                                className={
                                                    classes.tableHeadCell
                                                }
                                            >
                                                {formatMessage(
                                                    MESSAGES[sourceInfoKey],
                                                )}
                                            </TableCell>
                                        );
                                    },
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data
                                ?.slice(
                                    page * rowsPerPage,
                                    page * rowsPerPage + rowsPerPage,
                                )
                                .map((district, i) => {
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
                                                    {district.region}
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
                                                    {district.name}
                                                </TableCell>
                                                {orderedSourceInfoKeys.map(
                                                    (sourceInfoKey, index) => {
                                                        return (
                                                            <TableCell
                                                                key={`${tableKey}${sourceInfoKey}${index}`}
                                                                style={{
                                                                    cursor: 'default',
                                                                }}
                                                                align="center"
                                                                className={
                                                                    classes.lqasImTableCell
                                                                }
                                                            >
                                                                {
                                                                    district
                                                                        .care_giver_stats[
                                                                        sourceInfoKey
                                                                    ]
                                                                }
                                                            </TableCell>
                                                        );
                                                    },
                                                )}
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
                    count={data?.length ?? 0}
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
