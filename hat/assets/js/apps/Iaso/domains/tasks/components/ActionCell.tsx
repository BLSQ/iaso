import React, { FunctionComponent } from 'react';
import ReplayIcon from '@mui/icons-material/Replay';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import { TaskModal } from 'Iaso/domains/tasks/components/TaskModal';
import { useKillTask, useRelaunchTask } from 'Iaso/domains/tasks/hooks/api';
import MESSAGES from 'Iaso/domains/tasks/messages';
import { Task } from 'Iaso/domains/tasks/types';
import { useCustomComponentsByKey } from 'Iaso/plugins/hooks/customComponents';

export type Props = {
    task: Task<any>;
};

export const TaskActionCell: FunctionComponent<Props> = ({ task }) => {
    const { formatMessage } = useSafeIntl();
    const taskRowActions = useCustomComponentsByKey('tasks.rowAction');
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
            {taskRowActions.map(TaskRowAction => {
                const key =
                    typeof TaskRowAction === 'function'
                        ? TaskRowAction.displayName || TaskRowAction.name
                        : String(TaskRowAction);
                return <TaskRowAction key={key} task={task} />;
            })}
            <TaskModal task={task} iconProps={{}} />
        </section>
    );
};
