import React, { FunctionComponent, useRef, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
    Paper,
    Box,
    CircularProgress,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { TaskLog } from 'Iaso/domains/tasks/types';
import MESSAGES from '../messages';

export type Props = {
    messages?: TaskLog[];
    isRunning?: boolean;
    isFetching?: boolean;
    displayLoader?: boolean;
};

export const TaskLogMessages: FunctionComponent<Props> = ({
    messages,
    isRunning = false,
    isFetching = false,
    displayLoader = true,
}) => {
    const { formatMessage } = useSafeIntl();
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, messagesEndRef]);
    return (
        <Paper elevation={1}>
            <Typography
                variant="h6"
                color="primary"
                sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}
            >
                {formatMessage(MESSAGES.logs)}
            </Typography>
            <Box
                sx={{
                    overflowY: 'auto',
                    maxHeight: 500,
                    scrollSnapAlign: 'end',
                }}
            >
                {messages && (
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table size="small">
                            <TableBody>
                                {messages.length === 0 && !isRunning && (
                                    <TableRow>
                                        <TableCell colSpan={2}>
                                            {formatMessage(
                                                MESSAGES.noLogsToShow,
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {displayLoader && isFetching && (
                                    <TableRow>
                                        <TableCell colSpan={2}>
                                            <CircularProgress size={20} />
                                        </TableCell>
                                    </TableRow>
                                )}
                                {messages.map(log => (
                                    <TableRow key={log.created_at}>
                                        <TableCell
                                            sx={{
                                                color: 'grey',
                                                whiteSpace: 'nowrap',
                                                width: '15%',
                                                verticalAlign: 'top',
                                            }}
                                        >
                                            {moment
                                                .unix(log.created_at)
                                                .format('LTS')}
                                        </TableCell>
                                        <TableCell>
                                            <pre
                                                style={{
                                                    margin: 0,
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                {log.message}
                                            </pre>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                <Box ref={messagesEndRef} />
            </Box>
        </Paper>
    );
};
