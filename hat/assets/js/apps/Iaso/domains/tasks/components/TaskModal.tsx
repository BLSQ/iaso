import React, { FunctionComponent, useEffect, useState } from 'react';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import {
    Box,
    CircularProgress,
    Divider,
    IconButton,
    Typography,
} from '@mui/material';
import { AlertModal, makeFullModal, useSafeIntl } from 'bluesquare-components';
import { useQueryClient } from 'react-query';
import { TaskHeader } from 'Iaso/domains/tasks/components/TaskHeader';
import { TaskLogMessages } from 'Iaso/domains/tasks/components/TaskLogMessages';
import { TaskResultPanel } from 'Iaso/domains/tasks/components/TaskResultPanel';
import { TaskSummary } from 'Iaso/domains/tasks/components/TaskSummary';
import { useGetLogs } from 'Iaso/domains/tasks/hooks/api';
import { useGetTaskDetails } from 'Iaso/domains/tasks/hooks/useGetTasks';
import { Task } from 'Iaso/domains/tasks/types';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import { ACTIVE_STATUSES } from '../utils';
import { TaskParameters, TaskParams } from './TaskParameters';

const styles: SxStyles = {
    columns: {
        display: 'grid',
        gap: 2,
        alignItems: 'start',
        gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'minmax(0, 1fr) 248px',
        },
        gridTemplateRows: { md: 'auto 1fr' },
        gridTemplateAreas: {
            xs: '"result" "side" "logs"',
            md: '"result side" "logs side"',
        },
    },
    result: { gridArea: 'result', display: 'grid', gap: 2, minWidth: 0 },
    side: { gridArea: 'side', minWidth: 0 },
    logs: { gridArea: 'logs', minWidth: 0 },
    logsPlaceholder: {
        m: 2,
        p: 2,
        display: 'flex',
        gap: 1.5,
        alignItems: 'center',
        border: 1,
        borderStyle: 'dashed',
        borderColor: 'divider',
        borderRadius: 1,
        color: 'text.secondary',
    },
};

export type Props = {
    task: Task<any>;
    isOpen: boolean;
    taskParams?: TaskParams[];
    closeDialog: () => void;
};

const TaskModal: FunctionComponent<Props> = ({
    task,
    isOpen,
    closeDialog,
    taskParams = [],
}) => {
    const queryClient = useQueryClient();
    const { formatMessage } = useSafeIntl();
    const [isRunning, setRunning] = useState(false);
    const { data, isFetching } = useGetLogs(task.id, isRunning);
    useEffect(() => {
        setRunning(ACTIVE_STATUSES.includes(data?.status ?? task.status));
        if (task.status != data?.status) {
            queryClient.invalidateQueries(['tasks']).then();
        }
    }, [data, task, setRunning, queryClient]);
    // Polled while running, to follow progress and the worker heartbeat
    const { data: fetchedTask } = useGetTaskDetails(task.id, isRunning);
    // Some callers only know the id and status of the task
    const currentTask = fetchedTask ?? task;
    return (
        <AlertModal
            isOpen={isOpen}
            closeDialog={closeDialog}
            titleMessage={''}
            id="task-logs-modal"
            maxWidth="md"
        >
            {currentTask.created_at ? (
                <Box display="grid" gap={2}>
                    <TaskHeader task={currentTask} />
                    <Divider />
                    <Box sx={styles.columns}>
                        <Box sx={styles.result}>
                            <TaskResultPanel task={currentTask} />
                            {taskParams.length > 0 && (
                                <TaskParameters taskParams={taskParams} />
                            )}
                        </Box>
                        <Box sx={styles.side}>
                            <TaskSummary task={currentTask} />
                        </Box>
                        <Box sx={styles.logs}>
                            <TaskLogMessages
                                messages={data?.logs}
                                isFetching={isFetching}
                                isRunning={isRunning}
                                startedAt={currentTask.started_at}
                                singleLine
                                emptyPlaceholder={
                                    currentTask.status === 'QUEUED' && (
                                        <Box sx={styles.logsPlaceholder}>
                                            <HourglassEmptyIcon color="disabled" />
                                            <Typography variant="body2">
                                                {formatMessage(
                                                    MESSAGES.logsNotStarted,
                                                )}
                                            </Typography>
                                        </Box>
                                    )
                                }
                            />
                        </Box>
                    </Box>
                </Box>
            ) : (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress color="primary" />
                </Box>
            )}
        </AlertModal>
    );
};

type IconButtonProps = {
    onClick: () => void;
};

const Icon: FunctionComponent<IconButtonProps> = ({ onClick }) => {
    return (
        <IconButton color="default" aria-label="Logs" onClick={onClick}>
            <RemoveRedEyeIcon />
        </IconButton>
    );
};

const modalWithIconButton = makeFullModal(TaskModal, Icon);

export { modalWithIconButton as TaskModal };
