import React, { FunctionComponent } from 'react';
import { Typography } from '@mui/material';
import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import { useKillTask } from '../hooks/api';
import MESSAGES from '../messages';
import { Task } from '../types';

type Props = {
    task: Task<any>;
    open: boolean;
    closeDialog: () => void;
};

export const StopTaskConfirmModal: FunctionComponent<Props> = ({
    task,
    open,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: killTask } = useKillTask();
    return (
        <ConfirmCancelModal
            open={open}
            onClose={closeDialog}
            closeDialog={closeDialog}
            onCancel={closeDialog}
            onConfirm={() => killTask({ id: task.id, should_be_killed: true })}
            id={`stop-task-${task.id}`}
            dataTestId="stop-task-modal"
            maxWidth="xs"
            titleMessage={formatMessage(MESSAGES.stopTaskTitle, {
                name: task.name,
            })}
            confirmMessage={MESSAGES.stopTaskConfirm}
            cancelMessage={MESSAGES.cancel}
        >
            <Typography variant="body2" color="text.secondary">
                {formatMessage(MESSAGES.stopTaskWarning)}
            </Typography>
        </ConfirmCancelModal>
    );
};
