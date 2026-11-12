import React, {
    FunctionComponent,
    ReactNode,
    useEffect,
    useState,
} from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { SxStyles } from 'Iaso/types/general';
import getDisplayName from 'Iaso/utils/usersUtils';
import { Nullable } from '../../../types/utils';
import MESSAGES from '../messages';
import { Task } from '../types';
import { durationBetween, formatDuration } from '../utils';
import { TaskStatusStep } from './TaskStatusStep';

const styles: SxStyles = {
    root: {
        display: 'grid',
        gap: 2,
        alignContent: 'start',
    },
    facts: {
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        m: 0,
        '& > dt, & > dd': {
            m: 0,
            py: 1,
            borderBottom: 1,
            borderColor: 'divider',
        },
        '& > :nth-last-child(-n+2)': {
            borderBottom: 0,
        },
    },
    factLabel: {
        pl: 2,
        pr: 1,
    },
    factValue: {
        pr: 2,
        pl: 1,
        textAlign: 'right',
        fontWeight: 500,
        fontVariantNumeric: 'tabular-nums',
        minWidth: 0,
        overflowWrap: 'anywhere',
    },
    timeline: {
        display: 'grid',
        px: 2,
        py: 1.5,
    },
    step: {
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
    connector: {
        ml: '4.5px',
        minHeight: 16,
        borderLeft: 1,
    },
};

// Re-renders every second while `enabled`, to display live durations.
const useNow = (enabled: boolean): number => {
    const [now, setNow] = useState(() => moment().unix());
    useEffect(() => {
        if (!enabled) return undefined;
        const interval = setInterval(() => setNow(moment().unix()), 1000);
        return () => clearInterval(interval);
    }, [enabled]);
    return now;
};

type FactProps = { label: string; value: ReactNode; detail?: ReactNode };

const Fact: FunctionComponent<FactProps> = ({ label, value, detail }) => (
    <>
        <Typography
            component="dt"
            variant="body2"
            color="text.secondary"
            sx={styles.factLabel}
        >
            {label}
        </Typography>
        <Typography component="dd" variant="body2" sx={styles.factValue}>
            {value}
            {detail && (
                <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    fontWeight={400}
                >
                    {detail}
                </Typography>
            )}
        </Typography>
    </>
);

type StepProps = {
    label: string;
    time?: Nullable<number>;
};

// A step without a time is drawn hollow
const Step: FunctionComponent<StepProps> = ({ label, time }) => (
    <Box sx={styles.step}>
        <Box
            sx={{
                ...styles.dot,
                ...(time
                    ? { bgcolor: 'grey.400' }
                    : {
                          border: 1.5,
                          borderStyle: 'dashed',
                          borderColor: 'grey.500',
                      }),
            }}
        />
        <Box>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {time ? moment.unix(time).format('LTS') : textPlaceholder}
            </Typography>
        </Box>
    </Box>
);

type ConnectorProps = { variant: 'done' | 'live' | 'none' };

const Connector: FunctionComponent<ConnectorProps> = ({ variant }) => (
    <Box
        sx={{
            ...styles.connector,
            borderLeftStyle: variant === 'done' ? 'solid' : 'dashed',
            borderColor: variant === 'none' ? 'divider' : 'grey.400',
        }}
    />
);

type Props = {
    task: Task<any>;
};

// Side column of the task details
export const TaskSummary: FunctionComponent<Props> = ({ task }) => {
    const { formatMessage } = useSafeIntl();
    const isQueued = task.status === 'QUEUED';
    const isRunning = task.status === 'RUNNING';
    const now = useNow(isRunning);

    // A relaunched task keeps the times of its previous run until a worker picks it up again
    const startedAt = isQueued ? null : task.started_at;
    const ran = isRunning
        ? durationBetween(startedAt, now)
        : durationBetween(startedAt, task.ended_at);

    const creator = task.created_by ?? task.launcher;
    const relaunchedBy =
        task.launcher && task.launcher.id !== creator?.id
            ? task.launcher
            : undefined;

    return (
        <Box sx={styles.root}>
            <Paper variant="outlined">
                <Box component="dl" sx={styles.facts} data-test="task-facts">
                    <Fact
                        label={formatMessage(MESSAGES.createdBy)}
                        value={
                            creator ? getDisplayName(creator) : textPlaceholder
                        }
                        detail={
                            relaunchedBy &&
                            formatMessage(MESSAGES.relaunchedBy, {
                                user: getDisplayName(relaunchedBy),
                            })
                        }
                    />
                    <Fact
                        label={formatMessage(
                            isRunning ? MESSAGES.runningFor : MESSAGES.duration,
                        )}
                        value={
                            ran !== undefined
                                ? formatDuration(ran)
                                : textPlaceholder
                        }
                    />
                </Box>
            </Paper>
            <Paper variant="outlined">
                <Box sx={styles.timeline} data-test="task-timeline">
                    <Step
                        label={formatMessage(MESSAGES.stepCreated)}
                        time={task.created_at}
                    />
                    {!isQueued && (
                        <>
                            <Connector variant={startedAt ? 'done' : 'none'} />
                            <Step
                                label={formatMessage(
                                    startedAt
                                        ? MESSAGES.stepStarted
                                        : MESSAGES.stepStart,
                                )}
                                time={startedAt}
                            />
                        </>
                    )}
                    <Connector
                        variant={isQueued || isRunning ? 'live' : 'done'}
                    />
                    <TaskStatusStep task={task} />
                </Box>
            </Paper>
        </Box>
    );
};
