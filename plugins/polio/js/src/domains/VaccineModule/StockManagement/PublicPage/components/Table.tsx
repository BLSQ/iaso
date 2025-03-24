import React, { FunctionComponent, useCallback } from 'react';
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
import {
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import { baseUrls } from '../../../../../constants/urls';
import MESSAGES from '../messages';

type Props = {
    data: any;
    isLoading: boolean;
    tab: 'usable' | 'unusable';
    params: any;
};

export const Table: FunctionComponent<Props> = ({
    data,
    isLoading,
    tab,
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const tabText = formatMessage(MESSAGES[tab]);
    const redirectTo = useRedirectTo();
    const handleChangePage = useCallback(
        (_event, newPage) => {
            redirectTo(baseUrls.embeddedVaccineStock, {
                ...params,
                page: newPage + 1,
            });
        },
        [params, redirectTo],
    );
    const handleChangeRowsPerPage = useCallback(
        event => {
            redirectTo(baseUrls.embeddedVaccineStock, {
                ...params,
                page: 1,
                pageSize: parseInt(event.target.value, 10),
            });
        },
        [params, redirectTo],
    );
    return (
        <>
            {isLoading && <LoadingSpinner />}
            <Box ml={1} mr={1} sx={{ overflow: 'auto', maxHeight: '500px' }}>
                <Box ml={2}>
                    <Typography
                        variant="h5"
                        sx={{ color: '#808080', fontWeight: 'bold' }}
                    >
                        {tabText}
                    </Typography>
                </Box>
                <TableContainer>
                    <MuiTable stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    variant="head"
                                    style={{
                                        cursor: 'pointer',
                                        color: '#0a4780',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 'bold' }}>
                                        {formatMessage(MESSAGES.country)}
                                    </Typography>
                                </TableCell>
                                <TableCell
                                    variant="head"
                                    style={{
                                        cursor: 'pointer',
                                        color: '#0a4780',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 'bold' }}>
                                        {' '}
                                        {formatMessage(MESSAGES.vaccine)}
                                    </Typography>
                                </TableCell>
                                <TableCell
                                    variant="head"
                                    style={{
                                        cursor: 'pointer',
                                        color: '#0a4780',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 'bold' }}>
                                        {' '}
                                        {formatMessage(MESSAGES.date)}
                                    </Typography>
                                </TableCell>
                                <TableCell
                                    variant="head"
                                    style={{
                                        cursor: 'pointer',
                                        color: '#0a4780',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 'bold' }}>
                                        {' '}
                                        {formatMessage(MESSAGES.vialsType)}
                                    </Typography>
                                </TableCell>
                                <TableCell
                                    variant="head"
                                    style={{
                                        cursor: 'pointer',
                                        color: '#0a4780',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 'bold' }}>
                                        {' '}
                                        {formatMessage(MESSAGES.actionType)}
                                    </Typography>
                                </TableCell>
                                <TableCell
                                    variant="head"
                                    style={{
                                        cursor: 'pointer',
                                        color: '#0a4780',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 'bold' }}>
                                        {' '}
                                        {formatMessage(MESSAGES.action)}
                                    </Typography>
                                </TableCell>
                                <TableCell
                                    variant="head"
                                    style={{
                                        cursor: 'pointer',
                                        color: '#0a4780',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 'bold' }}>
                                        {' '}
                                        {formatMessage(MESSAGES.vialsIn)}
                                    </Typography>
                                </TableCell>
                                <TableCell
                                    variant="head"
                                    style={{
                                        cursor: 'pointer',
                                        color: '#0a4780',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 'bold' }}>
                                        {' '}
                                        {formatMessage(MESSAGES.vialsOut)}
                                    </Typography>
                                </TableCell>
                                <TableCell
                                    variant="head"
                                    style={{
                                        cursor: 'pointer',
                                        color: '#0a4780',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 'bold' }}>
                                        {' '}
                                        {formatMessage(MESSAGES.dosesIn)}
                                    </Typography>
                                </TableCell>
                                <TableCell
                                    variant="head"
                                    style={{
                                        cursor: 'pointer',
                                        color: '#0a4780',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 'bold' }}>
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
                                            <TableCell>{tabText}</TableCell>
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
                                            <TableCell>
                                                {entry.vials_in}
                                            </TableCell>
                                            <TableCell>
                                                {entry.vials_out}
                                            </TableCell>
                                            <TableCell>
                                                {entry.doses_in}
                                            </TableCell>
                                            <TableCell>
                                                {entry.doses_out}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </MuiTable>
                </TableContainer>
            </Box>
            <TablePagination
                rowsPerPageOptions={[5, 10, 20, 50]}
                component="div"
                count={data?.count ?? 0}
                rowsPerPage={data?.limit ?? 50}
                page={(data?.page ?? 1) - 1}
                labelRowsPerPage="Rows"
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </>
    );
};
