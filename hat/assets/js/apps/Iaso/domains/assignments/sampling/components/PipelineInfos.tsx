import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@mui/material';

import { TaskLogMessages } from 'Iaso/domains/tasks/components/TaskLogMessages';

import { TaskLogApiResponse } from 'Iaso/domains/tasks/types';
import { DjangoError, SxStyles } from 'Iaso/types/general';
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
};

export const PipelineInfos: FunctionComponent<Props> = ({
    error,
    taskLogs,
    isFetchingTaskLogs,
    isPipelineActive,
    taskId,
}) => {
    return (
        <Box sx={styles.taskLogsContainer}>
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
            {taskLogs &&
                taskLogs.progress_value > 0 &&
                taskLogs.end_value > 0 && (
                    <Box sx={styles.taskLogs}>
                        <Typography variant="body1">
                            {taskLogs.progress_value}/{taskLogs.end_value}
                        </Typography>
                    </Box>
                )}
        </Box>
    );
};
