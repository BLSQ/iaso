import React, { FunctionComponent } from 'react';
import {
    TableContainer,
    Table as MuiTable,
    TableCell,
    TableBody,
    TablePagination,
    TableRow,
    TableHead,
    Box,
    Typography,
} from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

type Props = {
    data: any;
    isLoading: boolean;
    tab: 'usable' | 'unusable';
};

export const Table: FunctionComponent<Props> = ({ data, isLoading, tab }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            {isLoading && <LoadingSpinner />}

            <TableContainer>
                <MuiTable stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.country)}
                                </Typography>
                            </TableCell>
                            <TableCell
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.vaccine)}
                                </Typography>
                            </TableCell>
                            <TableCell
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.date)}
                                </Typography>
                            </TableCell>
                            <TableCell
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.vialsType)}
                                </Typography>
                            </TableCell>
                            <TableCell
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.actionType)}
                                </Typography>
                            </TableCell>
                            <TableCell
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.action)}
                                </Typography>
                            </TableCell>
                            <TableCell
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.vialsIn)}
                                </Typography>
                            </TableCell>
                            <TableCell
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.vialsOut)}
                                </Typography>
                            </TableCell>
                            <TableCell
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.dosesIn)}
                                </Typography>
                            </TableCell>
                            <TableCell
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.dosesOut)}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data?.results &&
                            data.results.movements.map(entry => {
                                return (
                                    <TableRow>
                                        <TableCell>
                                            {entry.country_name}
                                        </TableCell>
                                        <TableCell>
                                            {entry.vaccine_type}
                                        </TableCell>
                                        <TableCell>{entry.date}</TableCell>
                                        <TableCell>
                                            {formatMessage(MESSAGES[tab])}
                                        </TableCell>
                                        <TableCell>
                                            {formatMessage(
                                                MESSAGES[entry.type],
                                            ) ?? entry.type}
                                        </TableCell>
                                        <TableCell>
                                            {formatMessage(
                                                MESSAGES[entry.action],
                                            ) ?? entry.action}
                                        </TableCell>
                                        <TableCell>{entry.vials_in}</TableCell>
                                        <TableCell>{entry.vials_out}</TableCell>
                                        <TableCell>{entry.doses_in}</TableCell>
                                        <TableCell>{entry.doses_out}</TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </MuiTable>
            </TableContainer>
            {/* <TablePagination
                // className={classes.tablePagination}
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={data.count}
                rowsPerPage={data.limit}
                page={data.page}
                labelRowsPerPage="Rows"
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            /> */}
        </>
    );
};
