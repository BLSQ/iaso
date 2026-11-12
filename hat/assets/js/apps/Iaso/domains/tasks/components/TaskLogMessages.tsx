import React, { FunctionComponent, ReactNode, useRef, useEffect } from 'react';
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
import { SxStyles } from 'Iaso/types/general';
import { Nullable } from '../../../types/utils';
import MESSAGES from '../messages';
import { formatOffset } from '../utils';

const styles: SxStyles = {
    // The scroll container above handles the sideways scroll
    singleLine: {
        overflowX: 'visible',
    },
};

export type Props = {
    messages?: TaskLog[];
    isRunning?: boolean;
    isFetching?: boolean;
    displayLoader?: boolean;
    // When set, each log also shows the time elapsed since the task started
    startedAt?: Nullable<number>;
    // One line per log, scrolling sideways instead of wrapping
    singleLine?: boolean;
    // Show a placeholder instead of the table while there are no logs
    emptyPlaceholder?: ReactNode;
};

export const TaskLogMessages: FunctionComponent<Props> = ({
    messages,
    isRunning = false,
    isFetching = false,
    displayLoader = true,
    startedAt,
    singleLine = false,
    emptyPlaceholder,
}) => {
    const { formatMessage } = useSafeIntl();
    const scrollRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        const list = scrollRef.current;
        list?.scrollTo?.({ top: list.scrollHeight, behavior: 'smooth' });
    }, [messages]);
    return (
        <Paper elevation={1}>
            <Typography
                variant="h6"
                color="primary"
                sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}
            >
                {formatMessage(MESSAGES.logs)}
                {messages && messages.length > 0 && (
                    <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                    >
                        {formatMessage(MESSAGES.logsCount, {
                            count: `${messages.length}`,
                        })}
                    </Typography>
                )}
            </Typography>
            <Box
                ref={scrollRef}
                sx={{
                    overflowY: 'auto',
                    overflowX: singleLine ? 'auto' : 'hidden',
                    // Leave room for what is above the logs on small screens
                    maxHeight: 'min(500px, 40vh)',
                }}
            >
                {messages?.length === 0 && emptyPlaceholder}
                {messages && !(messages.length === 0 && emptyPlaceholder) && (
                    <TableContainer
                        sx={singleLine ? styles.singleLine : undefined}
                    >
                        <Table size="small">
                            <TableBody>
                                {messages.length === 0 && !isRunning && (
                                    <TableRow>
                                        <TableCell colSpan={startedAt ? 3 : 2}>
                                            {formatMessage(
                                                MESSAGES.noLogsToShow,
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {displayLoader && isFetching && (
                                    <TableRow>
                                        <TableCell colSpan={startedAt ? 3 : 2}>
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
                                        {startedAt && (
                                            <TableCell
                                                sx={{
                                                    color: 'grey',
                                                    whiteSpace: 'nowrap',
                                                    width: '1%',
                                                    verticalAlign: 'top',
                                                    fontVariantNumeric:
                                                        'tabular-nums',
                                                }}
                                            >
                                                {formatOffset(
                                                    log.created_at - startedAt,
                                                )}
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <pre
                                                style={{
                                                    margin: 0,
                                                    whiteSpace: singleLine
                                                        ? 'pre'
                                                        : 'pre-wrap',
                                                    wordBreak: singleLine
                                                        ? 'normal'
                                                        : 'break-word',
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
            </Box>
        </Paper>
    );
};
