import React, { FunctionComponent, useState } from 'react';
import ReplayIcon from '@mui/icons-material/Replay';
import StopIcon from '@mui/icons-material/Stop';
import { Box, Button, LinearProgress, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { SxStyles } from 'Iaso/types/general';
import { useRelaunchTask } from '../hooks/api';
import MESSAGES from '../messages';
import { Task } from '../types';
import { getTranslatedStatusMessage } from './StatusCell';
import { StopTaskConfirmModal } from './StopTaskConfirmModal';

type Tone = 'info' | 'error' | 'warning' | 'success' | 'primary';

const toneOf = (status: Task<any>['status']): Tone => {
    switch (status) {
        case 'QUEUED':
        case 'RUNNING':
            return 'info';
        case 'ERRORED':
            return 'error';
        case 'KILLED':
            return 'warning';
        case 'SUCCESS':
        case 'EXPORTED':
            return 'success';
        default:
            return 'primary';
    }
};

const styles: SxStyles = {
    root: {
        display: 'grid',
        gridTemplateColumns: '10px 1fr',
        columnGap: 1.5,
        alignItems: 'start',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: '50%',
        mt: '5px',
    },
    bar: {
        mt: 1,
        height: 6,
        borderRadius: 3,
    },
    numbers: {
        display: 'flex',
        justifyContent: 'space-between',
        fontVariantNumeric: 'tabular-nums',
    },
};

type Props = {
    task: Task<any>;
};

// Last step of the timeline: shows task status and relaunch option
export const TaskStatusStep: FunctionComponent<Props> = ({ task }) => {
    const { formatMessage } = useSafeIntl();
    const [isStopModalOpen, setStopModalOpen] = useState(false);
    const { mutateAsync: relaunchTask, isLoading: isRelaunching } =
        useRelaunchTask();
    const tone = toneOf(task.status);
    const isActive = task.status === 'QUEUED' || task.status === 'RUNNING';
    const isDone = task.status === 'SUCCESS' || task.status === 'EXPORTED';

    let label = getTranslatedStatusMessage(formatMessage, task.status);
    if (task.status === 'QUEUED')
        label = formatMessage(MESSAGES.waitingForWorker);
    if (task.status === 'RUNNING') label = formatMessage(MESSAGES.stepRunning);
    if (task.status === 'ERRORED') label = formatMessage(MESSAGES.stepFailed);
    if (task.status === 'KILLED') label = formatMessage(MESSAGES.stepStopped);
    if (isDone) label = formatMessage(MESSAGES.succeeded);

    let caption: string | undefined;
    if (task.status === 'RUNNING' && task.heartbeat_at) {
        caption = formatMessage(MESSAGES.workerLastSeen, {
            time: moment.unix(task.heartbeat_at).fromNow(),
        });
    } else if (!isActive && task.ended_at) {
        caption = moment.unix(task.ended_at).format('LTS');
    }

    // A queued task may still carry the progress of a previous run: ignore it.
    const hasSteps = task.end_value > 0 && task.status !== 'QUEUED';
    const done = isDone ? task.end_value : task.progress_value;
    const percent = hasSteps
        ? Math.min(100, Math.max(0, Math.round((100 * done) / task.end_value)))
        : 0;
    const showBar = isActive || hasSteps;

    const canStop =
        ['QUEUED', 'RUNNING', 'UNKNOWN'].includes(task.status) &&
        !task.should_be_killed;

    return (
        <Box sx={styles.root} data-test="task-status-step">
            <Box
                sx={{
                    ...styles.dot,
                    bgcolor: `${tone}.main`,
                    ...(isActive && {
                        boxShadow: theme =>
                            `0 0 0 4px ${alpha(theme.palette.info.main, 0.18)}`,
                    }),
                }}
            />
            <Box minWidth={0}>
                <Typography
                    variant="body2"
                    fontWeight={500}
                    color={`${tone}.dark`}
                >
                    {label}
                </Typography>
                {caption && (
                    <Typography variant="caption" color="text.secondary">
                        {caption}
                    </Typography>
                )}
                {showBar && (
                    <LinearProgress
                        sx={styles.bar}
                        color={tone === 'primary' ? 'primary' : tone}
                        variant={hasSteps ? 'determinate' : 'indeterminate'}
                        value={hasSteps ? percent : undefined}
                    />
                )}
                {hasSteps && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                        sx={styles.numbers}
                    >
                        <span>
                            {done} / {task.end_value}
                        </span>
                        <span>{percent} %</span>
                    </Typography>
                )}
                {canStop && (
                    <Button
                        sx={{ mt: 1.5 }}
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<StopIcon />}
                        onClick={() => setStopModalOpen(true)}
                    >
                        {formatMessage(MESSAGES.stop)}
                    </Button>
                )}
                {task.status === 'ERRORED' && (
                    <Button
                        sx={{ mt: 1.5 }}
                        fullWidth
                        variant="outlined"
                        startIcon={<ReplayIcon />}
                        disabled={isRelaunching}
                        onClick={() => relaunchTask({ id: task.id })}
                    >
                        {formatMessage(MESSAGES.relaunchShort)}
                    </Button>
                )}
            </Box>
            <StopTaskConfirmModal
                task={task}
                open={isStopModalOpen}
                closeDialog={() => setStopModalOpen(false)}
            />
        </Box>
    );
};
