import React, { FunctionComponent } from 'react';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { Alert, AlertTitle, Box, CircularProgress } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { useTaskResultFile } from '../hooks/useTaskResultFile';
import MESSAGES from '../messages';
import { Task, TaskResult } from '../types';
import { TaskResultFileCard } from './TaskResultFileCard';

const styles: SxStyles = {
    alert: {
        '& .MuiAlert-message': { minWidth: 0, flex: 1 },
    },
    alertMuted: {
        '& .MuiAlert-message': { minWidth: 0, flex: 1 },
        bgcolor: 'grey.100',
        color: 'text.secondary',
        '& .MuiAlert-icon': { color: 'grey.500' },
    },
    spinner: {
        '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            '& circle': { animation: 'none' },
        },
    },
    message: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
};

type Props = {
    task: Task<TaskResult>;
};

export const TaskResultPanel: FunctionComponent<Props> = ({ task }) => {
    const { formatMessage } = useSafeIntl();
    const file = useTaskResultFile(task);
    const message = task.progress_message ?? task.result?.message;
    const messageNode = message && <Box sx={styles.message}>{message}</Box>;

    switch (task.status) {
        case 'QUEUED':
            return (
                <Alert
                    severity="info"
                    icon={<HourglassEmptyIcon />}
                    data-test="task-result"
                    sx={styles.alert}
                >
                    <AlertTitle>
                        {formatMessage(MESSAGES.waitingForWorker)}
                    </AlertTitle>
                    {formatMessage(MESSAGES.queuedHint)}
                </Alert>
            );
        case 'RUNNING':
            return (
                <Alert
                    severity="info"
                    icon={
                        <CircularProgress
                            size={20}
                            color="info"
                            sx={styles.spinner}
                        />
                    }
                    data-test="task-result"
                    sx={styles.alert}
                >
                    <AlertTitle>
                        {formatMessage(MESSAGES.inProgress)}
                    </AlertTitle>
                    {messageNode}
                </Alert>
            );
        case 'ERRORED':
            return (
                <Alert
                    severity="error"
                    data-test="task-result"
                    sx={styles.alert}
                >
                    <AlertTitle>{formatMessage(MESSAGES.failed)}</AlertTitle>
                    {messageNode}
                </Alert>
            );
        case 'KILLED':
            return (
                <Alert
                    severity="warning"
                    data-test="task-result"
                    sx={styles.alert}
                >
                    <AlertTitle>
                        {formatMessage(MESSAGES.stepStopped)}
                    </AlertTitle>
                    {messageNode}
                </Alert>
            );
        case 'SUCCESS':
        case 'EXPORTED':
            return (
                <>
                    <Alert
                        severity="success"
                        data-test="task-result"
                        sx={file.hasExpired ? styles.alertMuted : styles.alert}
                    >
                        <AlertTitle>
                            {formatMessage(MESSAGES.succeeded)}
                        </AlertTitle>
                        {messageNode}
                    </Alert>
                    <TaskResultFileCard {...file} />
                </>
            );
        default:
            return messageNode ? (
                <Alert
                    severity="info"
                    data-test="task-result"
                    sx={styles.alert}
                >
                    {messageNode}
                </Alert>
            ) : null;
    }
};
