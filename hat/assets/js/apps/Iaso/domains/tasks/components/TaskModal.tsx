import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { Box, CircularProgress, Grid, IconButton } from '@mui/material';
import { AlertModal, makeFullModal, useSafeIntl } from 'bluesquare-components';
import { useQueryClient } from 'react-query';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { TaskBaseInfo } from 'Iaso/domains/tasks/components/TaskBaseInfo';
import { TaskLogMessages } from 'Iaso/domains/tasks/components/TaskLogMessages';
import { useGetLogs, useGetTask } from 'Iaso/domains/tasks/hooks/api';
import { Task } from 'Iaso/domains/tasks/types';
import MESSAGES from '../messages';

export type Props = {
    task: Task<any>;
    isOpen: boolean;
    closeDialog: () => void;
};

const TaskModal: FunctionComponent<Props> = ({ task, isOpen, closeDialog }) => {
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const [isRunning, setRunning] = useState(false);
    const { data, isFetching } = useGetLogs(task.id, isRunning);
    const { formatMessage } = useSafeIntl();
    useEffect(() => {
        setRunning(['RUNNING', 'QUEUED'].includes(data?.status ?? task.status));
        if (task.status != data?.status) {
            queryClient.invalidateQueries(['tasks']).then();
        }
    }, [data, task, setRunning, queryClient]);
    const { data: fetchedTask } = useGetTask(task.id);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [data, messagesEndRef]);
    return (
        <AlertModal
            isOpen={isOpen}
            closeDialog={closeDialog}
            titleMessage={''}
            id="task-logs-modal"
            maxWidth="md"
        >
            <Grid container spacing={2}>
                <Grid item xs={8}>
                    <WidgetPaper title={formatMessage(MESSAGES.task)}>
                        <TaskBaseInfo size="small" task={fetchedTask ?? task} />
                    </WidgetPaper>
                </Grid>
            </Grid>

            <Box
                sx={{
                    mt: 2,
                }}
            >
                <TaskLogMessages
                    messages={data?.logs}
                    isFetching={isFetching}
                    isRunning={isRunning}
                />
            </Box>
            {(isFetching || isRunning) && (
                <Box
                    mt={2}
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
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
