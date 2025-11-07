import React, { FC } from 'react';
import HistoryIcon from '@mui/icons-material/History';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { IconButton } from 'bluesquare-components';
import { TaskModal } from 'Iaso/domains/tasks/components/TaskModal';
import { Task } from 'Iaso/domains/tasks/types';
import MESSAGES from '../duplicates/messages';

type Props = {
    status: string;
    onRelaunch: () => void;
    taskId: number;
};

export const ActionCell: FC<Props> = ({ status, taskId, onRelaunch }) => {
    return (
        <>
            <IconButton
                onClick={onRelaunch}
                overrideIcon={HistoryIcon}
                tooltipMessage={MESSAGES.relaunchAnalysis}
                disabled={status === 'RUNNING'}
            />
            <TaskModal
                task={{ id: taskId, status: status } as Task<any>}
                iconProps={{}}
            />
        </>
    );
};
