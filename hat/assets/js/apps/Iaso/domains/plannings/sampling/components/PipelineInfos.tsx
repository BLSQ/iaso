import React, { FunctionComponent } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

import { useSafeIntl } from 'bluesquare-components';
import { TaskLogMessages } from 'Iaso/domains/tasks/components/TaskLogMessages';

import { TaskLogApiResponse } from 'Iaso/domains/tasks/types';
import { DjangoError, SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { StatusInfos } from './StatusInfos';

type Props = {
    error: DjangoError | null;
    taskLogs?: TaskLogApiResponse;
    isFetchingTaskLogs: boolean;
    isPipelineActive: boolean;
    taskId?: number;
};

const styles: SxStyles = {
    taskLogs: {
        borderRadius: 1,
    },
    taskLogsContainer: {
        p: 3,
        border: '1px solid #e0e0e0',
        minHeight: '120px',
        borderRadius: 2,
        backgroundColor: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    progressContainer: {
        width: '100%',
        mb: 2,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
    },
    progressLabel: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 1,
    },
};

export const PipelineInfos: FunctionComponent<Props> = ({
    error,
    taskLogs,
    isFetchingTaskLogs,
    isPipelineActive,
    taskId,
}) => {
    const progressPercentage =
        taskLogs && taskLogs.end_value > 0
            ? (taskLogs.progress_value / taskLogs.end_value) * 100
            : 0;
    const { formatMessage } = useSafeIntl();
    return (
        <Box sx={styles.taskLogsContainer}>
            {taskLogs &&
                taskLogs.progress_value > 0 &&
                taskLogs.end_value > 0 && (
                    <Box sx={styles.progressContainer}>
                        <Box sx={styles.progressLabel}>
                            <Typography variant="body2" color="text.secondary">
                                {formatMessage(MESSAGES.progress)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {taskLogs.progress_value}/{taskLogs.end_value}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={progressPercentage}
                            sx={styles.progressBar}
                        />
                    </Box>
                )}
            {error && (
                <StatusInfos status="ERRORED" message={error.details.error} />
            )}
            {taskLogs && <StatusInfos status={taskLogs.status} />}
            {taskId && taskLogs && taskLogs?.logs?.length > 0 && (
                <Box sx={styles.taskLogs}>
                    <TaskLogMessages
                        messages={taskLogs.logs}
                        isFetching={isFetchingTaskLogs}
                        isRunning={isPipelineActive}
                        displayLoader={false}
                    />
                </Box>
            )}
        </Box>
    );
};
