import React, { FunctionComponent } from 'react';
import ReplayIcon from '@mui/icons-material/Replay';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import { NotificationImportDetailModal } from 'Iaso/domains/tasks/components/NotificationImportDetailModal';
import { TaskModal } from 'Iaso/domains/tasks/components/TaskModal';
import { useKillTask, useRelaunchTask } from 'Iaso/domains/tasks/hooks/api';
import MESSAGES from 'Iaso/domains/tasks/messages';
import { Task } from 'Iaso/domains/tasks/types';
import { userHasPermission } from 'Iaso/domains/users/utils';
import { POLIO_NOTIFICATIONS } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';

export type Props = {
    task: Task<any>;
};

export const TaskActionCell: FunctionComponent<Props> = ({ task }) => {
    const { formatMessage } = useSafeIntl();
    const hasPolioNotificationsPerm = userHasPermission(
        POLIO_NOTIFICATIONS,
        useCurrentUser(),
    );
    const { mutateAsync: killTaskAction } = useKillTask();
    const { mutateAsync: relaunchTaskAction } = useRelaunchTask();
    return (
        <section>
            {['QUEUED', 'RUNNING', 'UNKNOWN'].includes(task.status) &&
                !task.should_be_killed && (
                    <IconButton
                        onClick={() =>
                            killTaskAction({
                                id: task.id,
                                should_be_killed: true,
                            })
                        }
                        icon="stop"
                        tooltipMessage={MESSAGES.killTask}
                    />
                )}
            {task.status === 'ERRORED' && (
                <IconButton
                    onClick={() =>
                        relaunchTaskAction({
                            id: task.id,
                        })
                    }
                    overrideIcon={ReplayIcon}
                    tooltipMessage={MESSAGES.relaunch}
                />
            )}
            {task.should_be_killed &&
                task.status === 'RUNNING' &&
                formatMessage(MESSAGES.killSignalSent)}
            {hasPolioNotificationsPerm &&
                ['SUCCESS', 'ERRORED'].includes(task.status) &&
                task.name === 'create_polio_notifications_async' && (
                    <NotificationImportDetailModal task={task} iconProps={{}} />
                )}
            <TaskModal task={task} iconProps={{}} />
        </section>
    );
};
