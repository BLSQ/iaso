import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Receipt } from '@mui/icons-material';
import { Box, CircularProgress, IconButton } from '@mui/material';
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

const TaskLogsModal: FunctionComponent<Props> = ({
    task,
    isOpen,
    closeDialog,
}) => {
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
            maxWidth="lg"
        >
            <WidgetPaper title={formatMessage(MESSAGES.task)}>
                <TaskBaseInfo size="small" task={fetchedTask ?? task} />
            </WidgetPaper>
            <Box
                style={{
                    overflowY: 'auto',
                    maxHeight: 500,
                    scrollSnapAlign: 'end',
                }}
            >
                {!isRunning && (data == null || data?.logs.length == 0) && (
                    <p
                        style={{
                            width: '100%',
                            textAlign: 'center',
                            fontStyle: 'italic',
                        }}
                    >
                        {formatMessage(MESSAGES.noLogsToShow)}
                    </p>
                )}
                {data?.logs && <TaskLogMessages messages={data.logs} />}
                <div ref={messagesEndRef} />
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
            <Receipt />
        </IconButton>
    );
};

const modalWithIconButton = makeFullModal(TaskLogsModal, Icon);

export { modalWithIconButton as TaskLogsModal };
