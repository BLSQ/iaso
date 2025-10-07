import React, { FunctionComponent } from 'react';
import { Chip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from 'Iaso/domains/tasks/messages';
import { Task } from 'Iaso/domains/tasks/types';
import { SxStyles } from 'Iaso/types/general';

export type Props = {
    task: Task<any>;
};

const getTranslatedStatusMessage = (
    formatMessage: (record: Record<string, string>) => string,
    status: string,
): string => {
    // Return untranslated status if not translation available
    return MESSAGES[status.toLowerCase()]
        ? formatMessage(MESSAGES[status.toLowerCase()])
        : status;
};

const getStatusColor = (
    status: string,
): 'info' | 'success' | 'error' | 'warning' => {
    if (['QUEUED', 'RUNNING'].includes(status)) {
        return 'info';
    }
    if (['EXPORTED', 'SUCCESS'].includes(status)) {
        return 'success';
    }
    if (status === 'ERRORED') {
        return 'error';
    }
    return 'warning';
};

const safePercent = (a: number, b: number): string => {
    if (b === 0) {
        return '';
    }
    const percent = 100 * (a / b);
    return `${percent.toFixed(2)}%`;
};

const styles: SxStyles = {
    chip: {
        color: 'white',
    },
};

export const StatusCell: FunctionComponent<Props> = ({ task }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <span>
            {task.status === 'RUNNING' && task.end_value > 0 ? (
                `${task.progress_value}/${task.end_value} (${safePercent(
                    task.progress_value,
                    task.end_value,
                )})`
            ) : (
                <Chip
                    label={getTranslatedStatusMessage(
                        formatMessage,
                        task.status,
                    )}
                    color={getStatusColor(task.status)}
                    size="small"
                    sx={styles.chip}
                />
            )}
        </span>
    );
};
